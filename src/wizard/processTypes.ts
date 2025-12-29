// processTypes.ts

import type { StepComponentName } from "./stepRegistryTypes";

/**
 * Eindeutige Kennung eines Schrittes im Prozess.
 *
 * Beispiel:
 * - "welcome"
 * - "loadData"
 * - "taxRegistration"
 */
export type StepId = string;

/**
 * Beschreibung eines gesamten Prozesses
 * (z. B. Unternehmensgründung, Lebenslage, Fachverfahren).
 */
export interface ProcessDefinition {
  /**
   * Der erste Schritt, mit dem der Prozess startet.
   */
  initialStep: StepId;

  /**
   * Alle Schritte des Prozesses,
   * adressierbar über ihre StepId.
   */
  steps: Record<StepId, ProcessStep>;
}

/**
 * Beschreibung eines einzelnen Prozessschrittes.
 *
 * Ein Schritt beschreibt:
 * - welche UI-Komponente gerendert wird
 * - wie die Navigation erfolgt
 * - welche technischen Effekte auszulösen sind
 *
 * Er beschreibt explizit KEINE fachliche Entscheidung.
 */
export interface ProcessStep {
  /**
   * Name der Step-Komponente, die diesen Schritt rendert.
   *
   * Muss in der stepRegistry registriert sein.
   * Dadurch ist der Prozess statisch abgesichert.
   */
  component: StepComponentName;

  /**
   * ID des nächsten Schrittes.
   *
   * Semantik:
   * - undefined  → Konfigurationsfehler (vergessen)
   * - null       → bewusstes Prozessende
   * - StepId     → normaler Übergang
   */
  next?: StepId | null;

  /**
   * ID des vorherigen Schrittes.
   *
   * Optional, da nicht jeder Schritt
   * eine Rücknavigation erlaubt.
   */
  back?: StepId;

  /**
   * Optionale Seiteneffekte,
   * die beim Betreten des Schrittes ausgelöst werden.
   *
   * Effekte sind deklarativ beschrieben
   * und werden vom Wizard technisch ausgeführt,
   * ohne fachliche Interpretation.
   */
  effect?: ProcessEffect;
}

/**
 * Alle erlaubten Seiteneffekte.
 *
 * Bewusst stark eingeschränkt, um Wildwuchs
 * und implizite Fachlogik zu verhindern.
 */
export type ProcessEffect =
  | "loadHello";
