import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import yaml from "js-yaml";
import { parse } from "csv-parse/sync";
import crypto from "crypto";
import { normalize } from "./normalize";

type WzNodeRow = { code: string; level: string; title: string; parent_code?: string };
type SynRow = { term: string; language?: string; wz_code: string; weight?: string; source?: string };
type WzReqRow = { wz_code: string; requirement_id: string; applies_to_all_descendants?: string };

type RequirementYaml = {
  id: string;
  kind: "HINT" | "PERMIT";
  name: string;
  description?: string;
  severity?: "INFO" | "WARNING" | "ACTION_REQUIRED";
  when_stage?: "DURING_FOUNDATION" | "AFTER_FOUNDATION" | "ONGOING";
};

type HintRuleYaml = {
  id: string;
  requirement_id: string;
  wz_scope?: string;
  conditions?: {
    tagsAny?: string[];
    keywordsAny?: string[];
  };
  explain?: string;
};

function readText(p: string) {
  return fs.readFileSync(p, "utf8");
}

function readCsv<T>(p: string): T[] {
  const content = readText(p);
  return parse(content, { columns: true, skip_empty_lines: true, trim: true }) as T[];
}

function stableId(prefix: string, value: string) {
  const h = crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);
  return `${prefix}_${h}`;
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function normalizeWzCode(code?: string): string | null {
  if (!code) return null;
  return code.trim().replace(/\.0$/, "");
}

function main() {
  const root = process.cwd(); // classification/
  const srcWzDir = path.join(root, "source", "wz");
  const srcReqDir = path.join(root, "source", "requirements");
  const buildDir = path.join(root, "build");
  const distDir = path.join(root, "dist");
  ensureDir(distDir);

  const dbPath = path.join(distDir, "wz.db");
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

  const db = new Database(dbPath);
  const schema = readText(path.join(buildDir, "schema.sql"));
  db.exec(schema);

  // ---------- import wz_node ----------
  const wzNodes = readCsv<WzNodeRow>(path.join(srcWzDir, "wz_nodes.csv"));
  const insertNode = db.prepare(
    "INSERT INTO wz_node(code, level, title, parent_code, path) VALUES (?, ?, ?, ?, NULL)"
  );

  const nodeSet = new Set<string>();
  db.transaction(() => {
    for (const r of wzNodes) {
      const code = r.code?.trim();
      const level = Number(r.level);
      const title = r.title?.trim();
      const parent = (r.parent_code ?? "").trim() || null;

      if (!code || !title || Number.isNaN(level)) throw new Error(`Invalid wz_nodes row: ${JSON.stringify(r)}`);
      if (nodeSet.has(code)) throw new Error(`Duplicate WZ code in wz_nodes.csv: ${code}`);
      nodeSet.add(code);

      insertNode.run(code, level, title, parent);
    }
  })();

  // Validate parents exist
  for (const r of wzNodes) {
    const parent = (r.parent_code ?? "").trim();
    if (parent && !nodeSet.has(parent)) throw new Error(`Unknown parent_code '${parent}' for WZ '${r.code}'`);
  }

  // Compute path for each node (simple iterative ascent)
  const getParent = db.prepare("SELECT parent_code FROM wz_node WHERE code = ?");
  const updatePath = db.prepare("UPDATE wz_node SET path = ? WHERE code = ?");

  function computePath(code: string): string {
    const parts: string[] = [];
    let cur: string | null = code;
    const seen = new Set<string>();
    while (cur) {
      if (seen.has(cur)) throw new Error(`Cycle detected in WZ tree at ${cur}`);
      seen.add(cur);
      parts.unshift(cur);
      const row = getParent.get(cur) as { parent_code: string | null } | undefined;
      cur = row?.parent_code ?? null;
    }
    return parts.join("/");
  }

  db.transaction(() => {
    for (const code of nodeSet) {
      updatePath.run(computePath(code), code);
    }
  })();

  // ---------- import requirement ----------
  const reqYamlPath = path.join(srcReqDir, "requirements.yaml");
  const reqs = (yaml.load(readText(reqYamlPath)) as RequirementYaml[]) ?? [];
  const insertReq = db.prepare(
    "INSERT INTO requirement(id, kind, name, description, severity, when_stage) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const reqSet = new Set<string>();
  db.transaction(() => {
    for (const r of reqs) {
      if (!r.id || !r.kind || !r.name) throw new Error(`Invalid requirement: ${JSON.stringify(r)}`);
      if (reqSet.has(r.id)) throw new Error(`Duplicate requirement id: ${r.id}`);
      reqSet.add(r.id);
      insertReq.run(r.id, r.kind, r.name, r.description ?? "", r.severity ?? "INFO", r.when_stage ?? "ONGOING");
    }
  })();

  // ---------- import wz_requirement ----------
  const wzReqPath = path.join(srcReqDir, "wz_requirements.csv");
  if (fs.existsSync(wzReqPath)) {
    const wzReqs = readCsv<WzReqRow>(wzReqPath);
    const insertWzReq = db.prepare(
      "INSERT INTO wz_requirement(wz_code, requirement_id, applies_to_all_descendants) VALUES (?, ?, ?)"
    );

    db.transaction(() => {
      for (const r of wzReqs) {
        const wz = r.wz_code?.trim();
        const rid = r.requirement_id?.trim();
        const applies = (r.applies_to_all_descendants ?? "true").trim().toLowerCase() !== "false";

        if (!wz || !rid) throw new Error(`Invalid wz_requirements row: ${JSON.stringify(r)}`);
        if (!nodeSet.has(wz)) throw new Error(`Unknown WZ code in wz_requirements.csv: ${wz}`);
        if (!reqSet.has(rid)) throw new Error(`Unknown requirement_id in wz_requirements.csv: ${rid}`);

        insertWzReq.run(wz, rid, applies ? 1 : 0);
      }
    })();
  }

  // ---------- import wz_synonym ----------
  const synPath = path.join(srcWzDir, "wz_synonyms.csv");
  if (fs.existsSync(synPath)) {
    const syns = readCsv<SynRow>(synPath);
    const insertSyn = db.prepare(
      "INSERT INTO wz_synonym(id, term, normalized_term, language, wz_code, weight, source) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    db.transaction(() => {
      for (const s of syns) {
        const term = (s.term ?? "").trim();
        const wz = (s.wz_code ?? "").trim();
        const lang = (s.language ?? "de").trim();
        const weight = Number((s.weight ?? "1").trim());
        const source = (s.source ?? "manual").trim();

        if (!term || !wz) throw new Error(`Invalid wz_synonyms row: ${JSON.stringify(s)}`);
        if (!nodeSet.has(wz)) throw new Error(`Unknown WZ code in wz_synonyms.csv: ${wz}`);
        if (Number.isNaN(weight) || weight < 1) throw new Error(`Invalid weight in wz_synonyms.csv: ${JSON.stringify(s)}`);

        const norm = normalize(term);
        const id = stableId("syn", `${lang}:${norm}:${wz}`);

        insertSyn.run(id, term, norm, lang, wz, weight, source);
      }
    })();
  }

  // ---------- import hint_rules ----------
  const hintPath = path.join(srcReqDir, "hint_rules.yaml");
  if (fs.existsSync(hintPath)) {
    const hintRules = (yaml.load(readText(hintPath)) as HintRuleYaml[]) ?? [];
    const insertHint = db.prepare(
      "INSERT INTO hint_rule(id, requirement_id, wz_scope, condition_json, explain) VALUES (?, ?, ?, ?, ?)"
    );

    db.transaction(() => {
      for (const hr of hintRules) {
        if (!hr.id || !hr.requirement_id) throw new Error(`Invalid hint_rule: ${JSON.stringify(hr)}`);
        if (!reqSet.has(hr.requirement_id)) throw new Error(`Unknown requirement_id in hint_rules.yaml: ${hr.requirement_id}`);

        const condJson = JSON.stringify(hr.conditions ?? {});

        const scope = normalizeWzCode(hr.wz_scope);
        insertHint.run(hr.id, hr.requirement_id, scope, condJson, hr.explain ?? "");

      }
    })();
  }

  db.close();
  // eslint-disable-next-line no-console
  console.log(`✅ Built DB: ${dbPath}`);
}

main();
