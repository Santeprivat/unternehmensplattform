// processDefinition.ts
import { ProcessDefinition } from "./processTypes";

export const processDefinition: ProcessDefinition = {
  initialStep: "welcome",

  steps: {
    welcome: {
      component: "WelcomeStep",
      next: "loadData",
    },

    loadData: {
      component: "LoadDataStep",
      effect: "loadHello",
      back: "welcome",
      next: null, // bewusstes Prozessende
    },
  },
};
