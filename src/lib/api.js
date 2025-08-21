export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

/**
 * Envía el payload al backend Python.
 * Ajusta la ruta /consultar según tu FastAPI/Flask.
 */
export async function sendQuery(payload) {
  const res = await fetch(`${API_BASE_URL}/consultar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Error ${res.status}: ${text || res.statusText}`)
  }
  return res.json().catch(() => ({}))
}
