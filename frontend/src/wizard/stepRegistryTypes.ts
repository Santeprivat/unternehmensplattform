// stepRegistryTypes.ts
import type { ComponentType } from "react";

export interface StepProps {
  vorgang: unknown;

  /**
   * Übergibt den fachlichen Datenbeitrag dieses Schritts
   * an den Wizard.
   */
  onNext: (domainDataContribution?: unknown) => void;

  onBack: () => void;

  status?: "idle" | "loading" | "success" | "error";
  data?: unknown;
  error?: string;
}

export type StepRegistry = Record<string, ComponentType<StepProps>>;
export type StepComponentName = keyof StepRegistry;
