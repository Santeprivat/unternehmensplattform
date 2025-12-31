import type { StepRegistry } from "./stepRegistryTypes";

import WelcomeStep from "./steps/WelcomeStep";
import LoadDataStep from "./steps/LoadDataStep";

export const stepRegistry: StepRegistry = {
  WelcomeStep,
  LoadDataStep,
};
