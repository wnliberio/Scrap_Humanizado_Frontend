// src/lib/api.js
const RAW_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

// Normaliza BASE para que *siempre* termine con /api
const BASE = (() => {
  try {
    // Quita trailing slash duplicado y agrega /api si falta
    let b = RAW_BASE.trim();
    if (b.endsWith("/")) b = b.slice(0, -1);
    if (!b.endsWith("/api")) b = `${b}/api`;
    return b;
  } catch {
    return "http://127.0.0.1:8000/api";
  }
})();

export async function createConsultas(items, opts = {}) {
  const body = {
    items,
    modo: "async",
    headless: !!opts.headless,
  };

  if (opts.meta) {
    body.informe_meta = {
      tipo_alerta: opts.meta.tipo_alerta || "",
      monto_usd: opts.meta.monto_usd ?? null,
      fecha_alerta: opts.meta.fecha_alerta || null, // "YYYY-MM-DD"
    };
  }
  if (typeof opts.generate_report === "boolean") {
    body.generate_report = opts.generate_report;
  }

  const res = await fetch(`${BASE}/consultas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`createConsultas: ${res.status}`);
  return res.json();
}

export async function getJobStatus(jobId) {
  const res = await fetch(`${BASE}/consultas/${jobId}/status`);
  if (!res.ok) throw new Error(`getJobStatus: ${res.status}`);
  return res.json();
}

// ---- Reports ----
export async function listReports({ fechaDesde, fechaHasta, onlyDocx = true } = {}) {
  const qs = new URLSearchParams();
  if (fechaDesde) qs.set("fecha_desde", fechaDesde);
  if (fechaHasta) qs.set("fecha_hasta", fechaHasta);
  if (onlyDocx) qs.set("only_docx", "true");

  const url = `${BASE}/reports${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`listReports: ${res.status}`);
  return res.json();
}

export function downloadReportUrl(reportId) {
  return `${BASE}/reports/${reportId}/download`;
}
