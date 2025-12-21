const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchHello() {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/todos/1`
  );

  if (!response.ok) {
    throw new Error("API Fehler");
  }

  return response.json();
}
