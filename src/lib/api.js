// src/lib/api.js
const API_ROOT = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

async function httpJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* noop */ }

  if (!res.ok) {
    const detail = data?.detail || data || text || `HTTP ${res.status}`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

export async function createConsultas(items, { headless = false } = {}) {
  // POST /api/consultas
  return httpJson(`${API_ROOT}/api/consultas`, {
    method: "POST",
    body: JSON.stringify({
      items,
      modo: "async",
      headless,
    }),
  });
}

export async function getJobStatus(jobId) {
  // GET /api/consultas/{job_id}
  return httpJson(`${API_ROOT}/api/consultas/${jobId}`);
}
