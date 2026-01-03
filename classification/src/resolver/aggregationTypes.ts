import type { Assessment, Requirement } from "./types";

export type ActivityResult = {
  activityId: string;
  input: Assessment["input"];
  resolvedWz?: Assessment["resolvedWz"];
  permits: Requirement[];
  hints: Requirement[];
  clarification: Assessment["clarification"];
};

export type AggregatedRequirement = Requirement & {
  sources: {
    activityId: string;
    wzCode?: string;
  }[];
};

export type AggregatedClarification = {
  needed: boolean;
  sources: {
    activityId: string;
    reason: string;
  }[];
};

export type AggregatedAssessment = {
  activities: ActivityResult[];
  permits: AggregatedRequirement[];
  hints: AggregatedRequirement[];
  clarification: AggregatedClarification;
};
