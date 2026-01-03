// tests/evaluate.test.ts

import { evaluateUseCase } from "../src/application/evaluateUseCase";
import { EvaluateRequest } from "../src/domain/model/domainTypes";
import "dotenv/config";

function log(title: string, value: unknown) {
  console.log("\n=== " + title + " ===");
  console.dir(value, { depth: null });
}

const request: EvaluateRequest = {
  context: {
    jurisdiction: "DE",
    legalForm: "GMBH"
  },
  intent: {
    description: "Ich möchte Software entwickeln und IT-Beratung anbieten"
  }
};

const response = evaluateUseCase(request);

// --- Ausgaben zur Sichtprüfung (bewusst kein Testframework) -----

log("ACTIVITY SUGGESTIONS", response.activitySuggestions);
log("CLARIFICATIONS", response.clarifications);
log("APPROVAL REQUIREMENTS", response.approvalRequirements);
log("COMPANY NAME ASSESSMENT", response.companyNameAssessment);
log("PROPOSAL", response.proposal);
log("OVERALL RESULT", response.overallResult);

// --- Minimale fachliche Assertions -------------------------------

if (response.overallResult !== "INCOMPLETE") {
  throw new Error("Expected overallResult to be INCOMPLETE");
}

if (response.clarifications.length === 0) {
  throw new Error("Expected blocking clarifications");
}

console.log("\n✅ End-to-End-Test erfolgreich");
