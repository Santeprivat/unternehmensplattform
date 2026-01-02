export type RequirementKind = "PERMIT" | "HINT";
export type Severity = "INFO" | "WARNING" | "ACTION_REQUIRED";
export type WhenStage = "DURING_FOUNDATION" | "AFTER_FOUNDATION" | "ONGOING";

export type Requirement = {
  id: string;
  kind: RequirementKind;
  name: string;
  description: string;
  severity: Severity;
  when_stage: WhenStage;
};

export type Candidate = {
  wzCode: string;
  score: number;
  matchedTerms: string[];
};

export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export type ClarificationQuestion = {
  id: string;
  text: string;
  options: { wzCode: string; title: string }[];
};

export type Assessment = {
  input: {
    wzCode?: string;
    text?: string;
    tags?: string[];
  };
  resolvedWz?: {
    code: string;
    level: number;
    title: string;
    reason: "EXPLICIT_WZ" | "BEST_CANDIDATE" | "COMMON_ANCESTOR";
    confidence: Confidence;
  };
  candidates: Candidate[];
  permits: Requirement[];
  hints: (Requirement & { explain?: string })[];
  clarification: { needed: boolean; questions?: ClarificationQuestion[] };
};
