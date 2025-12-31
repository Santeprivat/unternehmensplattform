function LoadDataStep({
  status,
  data,
  error,
  onBack,
  onNext,
}) {
  return (
    <>
      <h2>Daten abrufen</h2>

      <p>
        In diesem Schritt werden beispielhaft Daten aus einem
        externen Service geladen. Später können hier z. B.
        Register- oder Zuständigkeitsinformationen erscheinen.
      </p>

      {/* Ladezustand */}
      {status === "loading" && (
        <p><strong>Lade Daten …</strong></p>
      )}

      {/* Fehlerzustand */}
      {status === "error" && (
        <p style={{ color: "#b00020" }}>
          Fehler beim Laden: {error}
        </p>
      )}

      {/* Erfolgszustand */}
      {status === "success" && (
        <>
          <h3>Ergebnis</h3>
          <pre
            style={{
              background: "#f5f7f9",
              padding: "1rem",
              borderRadius: "4px",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        </>
      )}

      {/* Navigation */}
      <div style={{ marginTop: "1.5rem" }}>
        <button className="secondary" onClick={onBack}>
          Zurück
        </button>

        {status === "success" && (
          <button
            style={{ marginLeft: "0.5rem" }}
            onClick={() => onNext()}
          >
            Weiter
          </button>
        )}
      </div>
    </>
  );
}

export default LoadDataStep;
