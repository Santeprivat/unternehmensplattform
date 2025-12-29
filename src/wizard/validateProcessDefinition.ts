// validateProcessDefinition.ts

import type { ProcessDefinition, ProcessStep } from "./processTypes";

/**
 * Validiert eine Prozessdefinition zur Laufzeit.
 *
 * Ziel:
 * - Frühes Scheitern bei inkonsistenter Konfiguration
 * - Klare Fehlermeldungen
 * - Schutz vor "leeren Screens" im Wizard
 */
export function validateProcessDefinition(
  process: ProcessDefinition
): void {
  // ─────────────────────────────
  // Grundstruktur
  // ─────────────────────────────
  if (!process.initialStep) {
    throw new Error("ProcessDefinition: initialStep fehlt");
  }

  if (!process.steps || Object.keys(process.steps).length === 0) {
    throw new Error("ProcessDefinition: steps sind leer oder fehlen");
  }

  // ─────────────────────────────
  // initialStep existiert
  // ─────────────────────────────
  if (!process.steps[process.initialStep]) {
    throw new Error(
      `ProcessDefinition: initialStep "${process.initialStep}" ist nicht definiert`
    );
  }

  // ─────────────────────────────
  // Schritte validieren
  // ─────────────────────────────
  for (const [stepId, step] of Object.entries(process.steps)) {
    validateStep(stepId, step, process);
  }
}

/**
 * Validiert einen einzelnen Schritt.
 */
function validateStep(
  stepId: string,
  step: ProcessStep,
  process: ProcessDefinition
): void {
  // ─────────────────────────────
  // component
  // ─────────────────────────────
  if (!step.component) {
    throw new Error(`Schritt "${stepId}" hat keine component`);
  }

  // ─────────────────────────────
  // next
  // ─────────────────────────────
  if (step.next === undefined) {
    throw new Error(
      `Schritt "${stepId}" hat kein 'next' definiert (undefined)`
    );
  }

  if (step.next !== null && !process.steps[step.next]) {
    throw new Error(
      `Schritt "${stepId}" verweist auf unbekannten next "${step.next}"`
    );
  }

  // ─────────────────────────────
  // back
  // ─────────────────────────────
  if (step.back !== undefined && !process.steps[step.back]) {
    throw new Error(
      `Schritt "${stepId}" verweist auf unbekannten back "${step.back}"`
    );
  }
}
