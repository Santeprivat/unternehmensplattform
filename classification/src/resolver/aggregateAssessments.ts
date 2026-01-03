import type {
  AggregatedAssessment,
  AggregatedRequirement,
  ActivityResult,
} from "./aggregationTypes";
import type { Assessment, Requirement } from "./types";

function aggregateRequirements(
  kind: "PERMIT" | "HINT",
  activities: ActivityResult[]
): AggregatedRequirement[] {
  const map = new Map<string, AggregatedRequirement>();

  for (const act of activities) {
    const reqs = kind === "PERMIT" ? act.permits : act.hints;

    for (const r of reqs) {
      const existing = map.get(r.id);
      const source = {
        activityId: act.activityId,
        wzCode: act.resolvedWz?.code,
      };

      if (!existing) {
        map.set(r.id, {
          ...r,
          sources: [source],
        });
      } else {
        existing.sources.push(source);
      }
    }
  }

  return Array.from(map.values());
}

export function aggregateAssessments(
  assessments: Assessment[]
): AggregatedAssessment {
  // 1️⃣ Einzelaktivitäten normieren
  const activities: ActivityResult[] = assessments.map((a, idx) => ({
    activityId: `A${idx + 1}`,
    input: a.input,
    resolvedWz: a.resolvedWz,
    permits: a.permits ?? [],
    hints: a.hints ?? [],
    clarification: a.clarification,
  }));

  // 2️⃣ Genehmigungen & Hinweise aggregieren
  const permits = aggregateRequirements("PERMIT", activities);
  const hints = aggregateRequirements("HINT", activities);

  // 3️⃣ Klärungsbedarf aggregieren
  const clarificationSources = activities
    .filter((a) => a.clarification?.needed)
    .map((a) => ({
      activityId: a.activityId,
      reason:
        a.clarification.questions?.[0]?.id ??
        "CLARIFICATION_REQUIRED",
    }));

  const clarification = {
    needed: clarificationSources.length > 0,
    sources: clarificationSources,
  };

  return {
    activities,
    permits,
    hints,
    clarification,
  };
}
