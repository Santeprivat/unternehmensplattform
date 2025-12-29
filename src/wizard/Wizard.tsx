import { useEffect, useState } from "react";
import { fetchHello } from "../api/helloApi";
import { processDefinition } from "./processDefinition";
import { stepRegistry } from "./stepRegistry";

import type { Vorgang } from "./vorgangTypes";
import type { ProcessStep } from "./processTypes";

import { validateProcessDefinition } from "./validateProcessDefinition";

// Prozessdefinition einmalig validieren (Runtime-Schutz)
validateProcessDefinition(processDefinition);

/**
 * Wizard
 * ======
 *
 * Prozess-Interpreter für den Unternehmenslebenszyklus.
 *
 * Er sammelt fachliche Datenbeiträge (domainDataContributions),
 * interpretiert sie jedoch nicht.
 */
function Wizard() {
  // ─────────────────────────────
  // Vorgangs-State (lokal, Mock)
  // ─────────────────────────────
  const [vorgang, setVorgang] = useState<Vorgang>({
    id: "local-vorgang-1",
    status: "IN_PROGRESS",
    currentStepId: processDefinition.initialStep,
    domainDataContributions: {},
  });

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string>("");

  // ─────────────────────────────
  // Aktuelle Schrittdefinition (unsicherer Zugriff)
  // ─────────────────────────────
  const stepDefUnsafe =
    processDefinition.steps[vorgang.currentStepId];

  // Guard gegen inkonsistente Prozessdefinition
  if (!stepDefUnsafe) {
    return (
      <p>
        Fehlerhafte Prozessdefinition: Schritt "{vorgang.currentStepId}" ist
        nicht definiert.
      </p>
    );
  }

  // ─────────────────────────────
  // Ab hier ist stepDef garantiert definiert
  // ─────────────────────────────
  const stepDef: ProcessStep = stepDefUnsafe;

  // ─────────────────────────────
  // Step-Komponente auflösen
  // ─────────────────────────────
  const StepComponent = stepRegistry[stepDef.component];

  if (!StepComponent) {
    return (
      <p>
        Fehlerhafte Prozessdefinition: Komponente "{stepDef.component}" ist
        nicht registriert.
      </p>
    );
  }

  // ─────────────────────────────
  // Prozess-Navigation: nextStep
  //
  // domainDataContribution:
  // Fachlicher Datenbeitrag dieses Schritts
  // im Unternehmenslebenszyklus.
  //
  // Der Wizard interpretiert diese Daten NICHT.
  // ─────────────────────────────
  function nextStep(domainDataContribution?: unknown) {
    if (!stepDef.next) return;

    setVorgang((v) => ({
      ...v,
      domainDataContributions: {
        ...v.domainDataContributions,
        [v.currentStepId]: domainDataContribution ?? null,
      },
      currentStepId: stepDef.next!,
    }));
  }

  // ─────────────────────────────
  // Rücknavigation
  // ─────────────────────────────
  function prevStep() {
    if (!stepDef.back) return;

    setVorgang((v) => ({
      ...v,
      currentStepId: stepDef.back!,
    }));
  }

  // ─────────────────────────────
  // Seiteneffekte
  // ─────────────────────────────
  useEffect(() => {
    if (stepDef.effect === "loadHello") {
      setStatus("loading");
      setError("");

      fetchHello()
        .then((result) => {
          setData(result);
          setStatus("success");
        })
        .catch(() => {
          setError("Fehler beim Laden");
          setStatus("error");
        });
    }
  }, [vorgang.currentStepId, stepDef.effect]);

  // ─────────────────────────────
  // Render
  // ─────────────────────────────
  return (
    <StepComponent
      vorgang={vorgang}
      onNext={nextStep}
      onBack={prevStep}
      status={status}
      data={data}
      error={error}
    />
  );
}

export default Wizard;
