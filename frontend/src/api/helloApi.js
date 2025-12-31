const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL ist nicht gesetzt");
}

export async function fetchHello() {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/todos/1`
  );

  if (!response.ok) {
    throw new Error("API Fehler");
  }

  return response.json();
}
