const API_BASE_URL = "https://jsonplaceholder.typicode.com";

export async function fetchHello() {
  const response = await fetch(`${API_BASE_URL}/todos/1`);

  if (!response.ok) {
    throw new Error("API Fehler");
  }

  return response.json();
}
