import { useEffect, useState } from "react";
import { fetchHello } from "./api/helloApi";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHello()
      .then(setData)
      .catch(() => setError("Fehler beim Laden"));
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Mini One-Stop-Shop</h1>

      {error && <p>{error}</p>}
      {!data && !error && <p>Lade Daten…</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}

export default App;
