import { useEffect, useState } from "react";
import { fetchHello } from "./api/helloApi";

function App() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  
  function nextStep() {
    setStep((s) => s + 1);
  }

  function prevStep() {
    setStep((s) => Math.max(1, s - 1));
  }

  useEffect(() => {
    setStatus("loading");

    fetchHello()
      .then((result) => {
        setData(result);
        setStatus("success");
      })
      .catch(() => {
        setError("Fehler beim Laden");
        setStatus("error");
      });
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Mini One-Stop-Shop</h1>
      
      {step === 1 && (
        <>
        <p>Willkommen im Mini One-Stop-Shop.</p>
        <p>Dieser Assistent führt Sie Schritt für Schritt durch den Prozess.</p>
        <button onClick={nextStep}>Start</button>
      </>
    )}
      
      {step === 2 && (
        <>
          <h2>Schritt 2: Daten laden</h2>

          {status === "loading" && <p>Lade Daten…</p>}
          {status === "error" && <p>{error}</p>}
          {status === "success" && (
            <pre>{JSON.stringify(data, null, 2)}</pre>
          )}

          <button onClick={prevStep}>Zurück</button>
        </>
      )}
    </div>
  );
}

export default App;
