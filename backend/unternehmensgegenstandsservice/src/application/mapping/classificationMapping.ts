import type {
  ApprovalRequirement,
  Clarification,
} from "../../domain/model/domainTypes";
import type { AggregatedAssessment } from "../../../../../classification/src/resolver/aggregationTypes";

export function mapPermits(
  agg: AggregatedAssessment
): ApprovalRequirement[] {
  return agg.permits.map((p) => ({
    type: "WZ_PERMIT",
    required: true,
    justification: p.description,
    ruleRefs: [p.id],
  }));
}

export function mapClarifications(
  agg: AggregatedAssessment
): Clarification[] {
  if (!agg.clarification.needed) return [];

  return [
    {
      id: "WZ_CLARIFICATION_REQUIRED",
      question:
        "Bitte präzisieren Sie Ihre Tätigkeit(en), damit eine eindeutige Zuordnung möglich ist.",
      severity: "BLOCKING",
    },
  ];
}
