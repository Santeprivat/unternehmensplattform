import { useEffect, useState } from "react";
import { fetchHello } from "../api/helloApi";
import { stepRegistry } from "./stepRegistry";

import type { Vorgang } from "./vorgangTypes";
import type { ProcessDefinition, ProcessStep } from "./processTypes";

import { loadProcessDefinition } from "./loadProcessDefinition";

import WizardLayout from "./WizardLayout";

/**
 * Wizard
 * ======
 *
 * Prozess-Interpreter für den Unternehmenslebenszyklus.
 *
 * - lädt eine Prozessdefinition (JSON)
 * - validiert diese zur Laufzeit
 * - interpretiert den Prozess
 * - sammelt fachliche Datenbeiträge (domainDataContributions)
 *
 * Fachliche Interpretation findet ausschließlich im Backend statt.
 */
function Wizard() {
  // ─────────────────────────────
  // Prozessdefinition (extern, JSON)
  // ─────────────────────────────
  const [processDefinition, setProcessDefinition] =
    useState<ProcessDefinition | null>(null);
  const [processError, setProcessError] =
    useState<string | null>(null);

  // ─────────────────────────────
  // Vorgang (lokal, Mock)
  // ─────────────────────────────
  const [vorgang, setVorgang] = useState<Vorgang | null>(null);

  // ─────────────────────────────
  // UI-Zustände für Seiteneffekte
  // ─────────────────────────────
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string>("");

  // ─────────────────────────────
  // Prozessdefinition laden (einmalig)
  // ─────────────────────────────
  useEffect(() => {
    loadProcessDefinition()
      .then(setProcessDefinition)
      .catch((err) => setProcessError(err.message));
  }, []);

  // ─────────────────────────────
  // Vorgang initialisieren, sobald Prozess da ist
  // ─────────────────────────────
  useEffect(() => {
    if (processDefinition && !vorgang) {
      setVorgang({
        id: "local-vorgang-1",
        status: "IN_PROGRESS",
        currentStepId: processDefinition.initialStep,
        domainDataContributions: {},
      });
    }
  }, [processDefinition, vorgang]);

  // ─────────────────────────────
  // Seiteneffekte beim Betreten eines Schritts
  //
  // WICHTIG:
  // Dieser Effekt darf NICHT vorzeitig returnen,
  // da Hooks immer in gleicher Reihenfolge
  // ausgeführt werden müssen.
  // ─────────────────────────────
  useEffect(() => {
    if (!processDefinition || !vorgang) return;

    const stepDef =
      processDefinition.steps[vorgang.currentStepId];

    if (stepDef?.effect === "loadHello") {
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
  }, [processDefinition, vorgang?.currentStepId]);

  // ─────────────────────────────
  // Guards: Prozess & Vorgang
  //
  // Guards kommen NACH allen Hooks!
  // ─────────────────────────────
  if (processError) {
    return <p>Fehler beim Laden des Prozesses: {processError}</p>;
  }

  if (!processDefinition) {
    return <p>Lade Prozessdefinition …</p>;
  }

  if (!vorgang) {
    return <p>Initialisiere Vorgang …</p>;
  }

  // ─────────────────────────────
  // Aktuelle Schrittdefinition (unsicherer Zugriff)
  // ─────────────────────────────
  const stepDefUnsafe =
    processDefinition.steps[vorgang.currentStepId];

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
  // ─────────────────────────────
  function nextStep(domainDataContribution?: unknown) {
    if (!stepDef.next) return;

    setVorgang((v) => {
      if (!v) return v;

      return {
        ...v,
        domainDataContributions: {
          ...v.domainDataContributions,
          [v.currentStepId]: domainDataContribution ?? null,
        },
        currentStepId: stepDef.next!,
      };
    });
  }

  // ─────────────────────────────
  // Rücknavigation
  // ─────────────────────────────
  function prevStep() {
    if (!stepDef.back) return;

    setVorgang((v) => {
      if (!v) return v;
      return {
        ...v,
        currentStepId: stepDef.back!,
      };
    });
  }

  // ─────────────────────────────
  // Render
  // ─────────────────────────────
  return (
    <WizardLayout>
      <StepComponent
        vorgang={vorgang}
        onNext={nextStep}
        onBack={prevStep}
        status={status}
        data={data}
        error={error}
      />
    </WizardLayout>
  );
}

export default Wizard;
