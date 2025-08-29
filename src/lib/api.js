// src/lib/api.js
const API_BASE = "/api"; // importante: el backend expone /api/...

export async function createConsultas(items, opts = {}) {
  const body = {
    items,
    modo: "async",
    headless: !!opts.headless,
    informe_meta: opts.informe_meta || null,
    generate_report: !!opts.generate_report,
  };

  const res = await fetch(`${API_BASE}/consultas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`createConsultas: ${res.status} ${txt}`);
  }
  return await res.json();
}

export async function getJobStatus(jobId) {
  const res = await fetch(`${API_BASE}/consultas/${encodeURIComponent(jobId)}/status`);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`getJobStatus: ${res.status} ${txt}`);
  }
  return await res.json();
}
