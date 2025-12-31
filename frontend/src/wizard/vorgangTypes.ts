// vorgangTypes.ts
import type { StepId } from "./processTypes";

export interface Vorgang {
  /**
   * Technische ID des Vorgangs
   */
  id: string;

  /**
   * Gesamtstatus des Vorgangs
   */
  status: "IN_PROGRESS" | "DONE" | "ERROR";

  /**
   * Aktueller Schritt im Prozess
   */
  currentStepId: StepId;

  /**
   * Fachliche Datenbeiträge je Prozessschritt.
   *
   * Die Daten werden vom Frontend nicht interpretiert,
   * sondern lediglich gesammelt und an den Vorgangsservice
   * übergeben.
   */
  domainDataContributions: Record<StepId, unknown>;
}
