// src/application/evaluateUseCase.ts

import {
  EvaluateRequest,
  EvaluateResponse,
  ActivitySuggestion,
  Clarification,
  ApprovalRequirement,
  CompanyNameAssessment,
  Proposal,
} from "../domain/model/domainTypes";

import { interpretIntent } from "../domain/intent/intentInterpreter";
import { assessCompanyName } from "../domain/rules/nameRules";
import { buildProposal } from "../domain/proposal/proposalBuilder";
import { classifyActivities } from "../infrastructure/classification/wzClassificationAdapter";
import {
  mapPermits,
  mapClarifications,
} from "./mapping/classificationMapping";

/**
 * Zentrale fachliche Orchestrierung der Bewertung.
 *
 * Zustandslos, deterministisch.
 * Aggregiert Tätigkeiten WZ-basiert und leitet daraus
 * Genehmigungen und Klärungsbedarfe ab.
 */
export function evaluateUseCase(
  request: EvaluateRequest
): EvaluateResponse {
  // --- 1. Initialisierung ------------------------------------------

  const activitySuggestions: ActivitySuggestion[] = [];
  const clarifications: Clarification[] = [];
  const approvalRequirements: ApprovalRequirement[] = [];

  // --- 2. Intent interpretieren ------------------------------------

  if (request.intent) {
    const interpretedActivities = interpretIntent(
      request.intent,
      request.resolvedFacts ?? []
    );

    activitySuggestions.push(...interpretedActivities);
  }

  // --- 3. WZ-Klassifikation + Aggregation ---------------------------

  const aggregatedClassification = classifyActivities(
    activitySuggestions.map((a) => ({
      // ⚠️ ggf. Feldnamen an ActivitySuggestion anpassen
      text: (a as any).text ?? (a as any).label,
      tags: (a as any).tags ?? [],
      wzCode: (a as any).wzCode,
    }))
  );

  // --- 4. Klärungsbedarfe aus Aggregation ---------------------------

  clarifications.push(
    ...mapClarifications(aggregatedClassification)
  );

  // --- 5. Genehmigungen aus Aggregation -----------------------------

  approvalRequirements.push(
    ...mapPermits(aggregatedClassification)
  );

  // --- 6. Unternehmensname bewerten --------------------------------

  let companyNameAssessment: CompanyNameAssessment | undefined;

  if (request.proposedCompanyName) {
    companyNameAssessment = assessCompanyName(
      request.proposedCompanyName,
      activitySuggestions
    );
  }

  // --- 7. Prüfen: ist der Vorgang fachlich abschließbar? ------------

  const hasBlockingClarifications = clarifications.some(
    (c) => c.severity === "BLOCKING"
  );

  if (hasBlockingClarifications) {
    return {
      activitySuggestions,
      clarifications,
      approvalRequirements,
      companyNameAssessment,
      overallResult: "INCOMPLETE",
    };
  }

  // --- 8. Proposal bauen -------------------------------------------

  const proposal: Proposal | undefined = buildProposal(
    activitySuggestions,
    approvalRequirements,
    request.proposedCompanyName
  );

  if (!proposal) {
    return {
      activitySuggestions,
      clarifications,
      approvalRequirements,
      companyNameAssessment,
      overallResult: "NOT_ALLOWED",
    };
  }

  // --- 9. Erfolgreicher Abschluss ----------------------------------

  return {
    activitySuggestions,
    clarifications: [],
    approvalRequirements,
    companyNameAssessment,
    proposal,
    overallResult: "ALLOWED",
  };
}
