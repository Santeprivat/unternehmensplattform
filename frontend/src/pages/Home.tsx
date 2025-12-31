import { useEffect, useState } from "react";
import { fetchHello } from "../api/helloApi";

export function Home() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHello()
      .then(setData)
      .catch(() => setError("Fehler beim Laden"));
  }, []);

  return (
    <main>
      <h1>Mini One-Stop-Shop</h1>

      {error && <p>{error}</p>}
      {!data && !error && <p>Lade Daten…</p>}

      {data && (
        <pre style={{ textAlign: "left" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}

