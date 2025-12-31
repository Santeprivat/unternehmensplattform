import type { ProcessDefinition } from "./processTypes";
import { validateProcessDefinition } from "./validateProcessDefinition";

/**
 * Lädt und validiert eine Prozessdefinition.
 *
 * Später ersetzbar durch:
 * - API-Call
 * - Länder-/Mandanten-spezifische Prozesse
 */
export async function loadProcessDefinition(): Promise<ProcessDefinition> {
  const response = await fetch("/processDefinition.json");

  if (!response.ok) {
    throw new Error("ProcessDefinition konnte nicht geladen werden");
  }

  const json = (await response.json()) as ProcessDefinition;

  // Laufzeit-Validierung (entscheidend!)
  validateProcessDefinition(json);

  return json;
}
