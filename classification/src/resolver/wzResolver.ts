import type Database from "better-sqlite3";
import { normalizeText, normalizeTag } from "./normalize";
import type { Assessment, Candidate, Confidence, Requirement } from "./types";

function isInScope(code: string, scope: string): boolean {
  if (code === scope) return true;
  if (code.startsWith(scope + ".")) return true;
  return false;
}

function confidenceFromScores(best: number, second: number | undefined): Confidence {
  if (best <= 0) return "LOW";
  if (second === undefined) return "HIGH";
  if (best >= second * 2) return "HIGH";
  if (best > second) return "MEDIUM";
  return "LOW";
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export class WzResolver {
  constructor(private db: Database.Database) {}

  /** Synonym-Matching -> scored candidates */
  resolveCandidatesFromText(text: string, language = "de"): Candidate[] {
    const normInput = normalizeText(text);
    if (!normInput) return [];

    // Load all synonyms for language (small enough for MVP; can be cached if needed)
    const rows = this.db
      .prepare(
        "SELECT term, normalized_term, wz_code as wzCode, weight FROM wz_synonym WHERE language = ?"
      )
      .all(language) as { term: string; normalized_term: string; wzCode: string; weight: number }[];

    const map = new Map<string, Candidate>();

    // substring match on normalized terms (explainable & deterministic)
    for (const r of rows) {
      const needle = r.normalized_term;
      if (!needle) continue;

      // word-boundary-ish: require needle to appear as whole words in the normalized string
      // (simple: contains + surrounding spaces checks)
      const hit =
        normInput === needle ||
        normInput.includes(" " + needle + " ") ||
        normInput.startsWith(needle + " ") ||
        normInput.endsWith(" " + needle) ||
        normInput.includes(" " + needle + " ") ||
        normInput.includes(needle + " "); // tolerate "term " inside

      if (!hit) continue;

      const existing = map.get(r.wzCode) ?? { wzCode: r.wzCode, score: 0, matchedTerms: [] };
      existing.score += Number(r.weight ?? 1);
      existing.matchedTerms.push(r.term);
      map.set(r.wzCode, existing);
    }

    const candidates = Array.from(map.values()).map((c) => ({
      ...c,
      matchedTerms: uniq(c.matchedTerms),
    }));

    candidates.sort((a, b) => b.score - a.score);
    return candidates;
  }

  getNode(code: string): { code: string; level: number; title: string; parent_code: string | null } | null {
    const row = this.db
      .prepare("SELECT code, level, title, parent_code FROM wz_node WHERE code = ?")
      .get(code) as any;
    return row ?? null;
  }

  getAncestors(code: string): string[] {
    const ancestors: string[] = [];
    let cur: string | null = code;
    const seen = new Set<string>();
    while (cur) {
      if (seen.has(cur)) break;
      seen.add(cur);
      ancestors.push(cur);
      const row = this.db
        .prepare("SELECT parent_code FROM wz_node WHERE code = ?")
        .get(cur) as { parent_code: string | null } | undefined;
      cur = row?.parent_code ?? null;
    }
    return ancestors;
  }

  /** Deterministic permit set for a given code (incl. inherited mappings) */
  getPermitIdsForCode(code: string): string[] {
    const ancestors = this.getAncestors(code);

    // inherited: applies_to_all_descendants = 1 on any ancestor
    // exact-only: applies_to_all_descendants = 0 only on the node itself
    const placeholders = ancestors.map(() => "?").join(",");
    const inherited = this.db
      .prepare(
        `SELECT requirement_id FROM wz_requirement
         WHERE applies_to_all_descendants = 1 AND wz_code IN (${placeholders})`
      )
      .all(...ancestors) as { requirement_id: string }[];

    const exact = this.db
      .prepare(
        `SELECT requirement_id FROM wz_requirement
         WHERE applies_to_all_descendants = 0 AND wz_code = ?`
      )
      .all(code) as { requirement_id: string }[];

    return uniq([...inherited.map((r) => r.requirement_id), ...exact.map((r) => r.requirement_id)]);
  }

  getRequirements(ids: string[]): Requirement[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => "?").join(",");
    const rows = this.db
      .prepare(
        `SELECT id, kind, name, description, severity, when_stage
         FROM requirement WHERE id IN (${placeholders})`
      )
      .all(...ids) as Requirement[];

    // stable order: by kind then name
    rows.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind.localeCompare(b.kind)));
    return rows;
  }

  /** Evaluate hint rules against final resolved WZ + (text,tags) */
  evaluateHints(resolvedWz: string, text: string | undefined, tags: string[] | undefined) {
    const norm = normalizeText(text ?? "");
    const tagSet = new Set((tags ?? []).map((t) => normalizeTag(String(t))));

    const rules = this.db
      .prepare("SELECT id, requirement_id, wz_scope, condition_json, explain FROM hint_rule")
      .all() as { id: string; requirement_id: string; wz_scope: string | null; condition_json: string; explain: string }[];

    const hitRequirementIds: { id: string; explain?: string }[] = [];

    for (const r of rules) {
      if (r.wz_scope && !isInScope(resolvedWz, r.wz_scope)) continue;

      const cond = (r.condition_json ? JSON.parse(r.condition_json) : {}) as {
        tagsAny?: string[];
        keywordsAny?: string[];
      };

      let ok = false;

      if (Array.isArray(cond.tagsAny) && cond.tagsAny.length > 0) {
        for (const ruleTag of cond.tagsAny) {
          const rt = normalizeTag(String(ruleTag));
          if (tagSet.has(rt)) {
            ok = true;
            break;
          }
        }
      }
      
      console.log("TAG MATCH CHECK", {
        rule: r.id,
        tagsAny: cond.tagsAny,
        tagSet: Array.from(tagSet),
        ok
      });


      if (!ok && Array.isArray(cond.keywordsAny) && cond.keywordsAny.length > 0 && norm) {
        ok = cond.keywordsAny.some((kw) => {
          const n = normalizeText(String(kw));
          return (
            n &&
            (norm === n ||
              norm.includes(" " + n + " ") ||
              norm.startsWith(n + " ") ||
              norm.endsWith(" " + n))
          );
        });
      }

      if (ok) hitRequirementIds.push({ id: r.requirement_id, explain: r.explain });
    }

    return hitRequirementIds;
  }

  /** Resolve a single activity to WZ + permits + hints (no persistence) */
  assess(input: { wzCode?: string; text?: string; tags?: string[] }): Assessment {
    const candidates: Candidate[] = [];

    // 1) explicit WZ wins (confidence high)
    if (input.wzCode) {
      const node = this.getNode(input.wzCode);
      if (!node) {
        return {
          input,
          candidates: [],
          permits: [],
          hints: [],
          clarification: {
            needed: true,
            questions: [
              {
                id: "INVALID_WZ",
                text: `Der angegebene WZ-Schlüssel '${input.wzCode}' ist unbekannt. Bitte wählen Sie einen gültigen Schlüssel.`,
                options: [],
              },
            ],
          },
        };
      }

      const permitIds = this.getPermitIdsForCode(node.code);
      const permitReqs = this.getRequirements(permitIds).filter((r) => r.kind === "PERMIT");

      const hintHits = this.evaluateHints(node.code, input.text, input.tags);
      const hintReqs = this.getRequirements(hintHits.map((h) => h.id))
        .filter((r) => r.kind === "HINT")
        .map((r) => ({ ...r, explain: hintHits.find((h) => h.id === r.id)?.explain }));

      return {
        input,
        resolvedWz: { code: node.code, level: node.level, title: node.title, reason: "EXPLICIT_WZ", confidence: "HIGH" },
        candidates: [],
        permits: permitReqs,
        hints: hintReqs,
        clarification: { needed: false },
      };
    }

    // 2) resolve from text via synonyms
    if (input.text) {
      candidates.push(...this.resolveCandidatesFromText(input.text));
    }

    // no candidates -> clarification needed (or accept "unknown")
    if (candidates.length === 0) {
      return {
        input,
        candidates: [],
        permits: [],
        hints: [],
        clarification: {
          needed: true,
          questions: [
            {
              id: "NO_MATCH",
              text: "Die Tätigkeit konnte keinem WZ-Schlüssel eindeutig zugeordnet werden. Bitte wählen Sie eine Kategorie aus.",
              options: [],
            },
          ],
        },
      };
    }

    const best = candidates[0];
    const second = candidates[1]?.score;
    const conf = confidenceFromScores(best.score, second);

    // 3) if multiple candidates exist, check if permit sets are identical -> pick common ancestor (highest)
    const topCandidates = candidates.slice(0, 3); // MVP: only top 3 affect decision
    const permitSets = topCandidates.map((c) => uniq(this.getPermitIdsForCode(c.wzCode)).sort());
    const allEqual = permitSets.every((s) => JSON.stringify(s) === JSON.stringify(permitSets[0]));

    let resolvedCode = best.wzCode;
    let reason: "BEST_CANDIDATE" | "COMMON_ANCESTOR" = "BEST_CANDIDATE";

    if (allEqual && topCandidates.length > 1) {
      // compute highest common ancestor among the candidate codes
      const ancestorLists = topCandidates.map((c) => this.getAncestors(c.wzCode)); // self -> root
      const common = ancestorLists.reduce((acc, list) => acc.filter((x) => list.includes(x)));
      // common currently from "self->root"; we want highest => closest to root => last element in that order
      if (common.length > 0) {
        resolvedCode = common[common.length - 1];
        reason = "COMMON_ANCESTOR";
      }
    } else if (!allEqual && conf === "LOW") {
      // permit divergence + low confidence => ask user
      const options = topCandidates.map((c) => {
        const n = this.getNode(c.wzCode);
        return { wzCode: c.wzCode, title: n?.title ?? c.wzCode };
      });
      return {
        input,
        candidates,
        permits: [],
        hints: [],
        clarification: {
          needed: true,
          questions: [
            {
              id: "AMBIGUOUS_ACTIVITY",
              text: "Mehrere Tätigkeiten passen, aber mit unterschiedlicher Genehmigungslage. Bitte wählen Sie die passendste Tätigkeit.",
              options,
            },
          ],
        },
      };
    }

    const resolvedNode = this.getNode(resolvedCode)!;

    // permits from resolved code (deterministic)
    const permitIds = this.getPermitIdsForCode(resolvedNode.code);
    const permitReqs = this.getRequirements(permitIds).filter((r) => r.kind === "PERMIT");

    // hints from rules
    const hintHits = this.evaluateHints(resolvedNode.code, input.text, input.tags);
    const hintReqs = this.getRequirements(hintHits.map((h) => h.id))
      .filter((r) => r.kind === "HINT")
      .map((r) => ({ ...r, explain: hintHits.find((h) => h.id === r.id)?.explain }));

    return {
      input,
      resolvedWz: {
        code: resolvedNode.code,
        level: resolvedNode.level,
        title: resolvedNode.title,
        reason,
        confidence: conf,
      },
      candidates,
      permits: permitReqs,
      hints: hintReqs,
      clarification: { needed: false },
    };
  }
}

