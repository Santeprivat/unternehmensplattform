import { describe, it, expect } from "vitest";
import { aggregateAssessments } from "../src/resolver/aggregateAssessments";
import type { Assessment } from "../src/resolver/types";

describe("aggregateAssessments", () => {
  it("aggregates permits, hints and clarification correctly", () => {
    const assessments: Assessment[] = [
      {
        input: {
          text: "Softwareentwicklung",
          tags: ["medical_device"],
        },
        resolvedWz: {
          code: "62.01",
          level: 3,
          title: "Programmierungstätigkeiten",
          reason: "BEST_CANDIDATE",
          confidence: "HIGH",
        },
        candidates: [
          {
            wzCode: "62.01",
            score: 42,
            matchedTerms: ["softwareentwicklung", "programmierung"],
          },
          {
            wzCode: "62.02",
            score: 18,
            matchedTerms: ["it-beratung"],
          },          
        ],
        permits: [],        
        hints: [
          {
            id: "MDR_HINT",
            kind: "HINT",
            name: "Medizinprodukte-Regulierung",
            description:
              "Software kann als Medizinprodukt gelten. Eine Prüfung nach MDR/IVDR ist erforderlich.",
            severity: "ACTION_REQUIRED",
            when_stage: "AFTER_FOUNDATION",
          },
        ],
        clarification: { 
          needed: true,
          questions: [
            { id: "AMBIGUOUS_ACTIVITY", 
              text: "Die Tätigkeit kann mehreren Wirtschaftszweigen zugeordnet werden. Bitte wählen Sie die passendste Kategorie.", 
              options: [
                {
                  wzCode: "62.01",
                  title: "Programmierungstätigkeiten",
                },
                {
                  wzCode: "62.02",
                  title: "IT-Beratung",
                },
              ]  
            }
          ],
        },
      },
    ];

    const result = aggregateAssessments(assessments);

    expect(result.hints.length).toBe(1);
    expect(result.hints[0].id).toBe("MDR_HINT");
    expect(result.hints[0].sources.length).toBe(1);

    expect(result.clarification.needed).toBe(true);
    expect(result.clarification.sources.length).toBe(1);
    expect(result.clarification.sources[0].activityId).toBe("A1");
  });
});
