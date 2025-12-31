function WelcomeStep({ onNext }) {
  return (
    <>
      <h2>Willkommen</h2>
      <p>
        Dieser Assistent führt Sie Schritt für Schritt
        durch die digitale Unternehmensgründung.
      </p>
      <button onClick={onNext}>Starten</button>
    </>
  );
}

export default WelcomeStep;