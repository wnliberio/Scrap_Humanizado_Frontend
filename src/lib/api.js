// src/lib/api.js - ACTUALIZADO CON NUEVAS FUNCIONES DE TRACKING
const RAW_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

// Normaliza BASE para que *siempre* termine con /api
const BASE = (() => {
  try {
    let b = RAW_BASE.trim();
    if (b.endsWith("/")) b = b.slice(0, -1);
    if (!b.endsWith("/api")) b = `${b}/api`;
    return b;
  } catch {
    return "http://127.0.0.1:8000/api";
  }
})();

// ===== FUNCIONES EXISTENTES (MANTENER PARA COMPATIBILIDAD) =====

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
      fecha_alerta: opts.meta.fecha_alerta || null,
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

// ===== FUNCIÓN FALTANTE PARA DASHBOARD =====
export async function getReportByJob(jobId) {
  /**
   * Obtiene un reporte específico por job ID.
   * Necesaria para el Dashboard original.
   */
  const url = `${BASE}/reports/by-job/${jobId}`;
  console.log("Llamando a:", url);
  
  const res = await fetch(url);
  console.log("Status:", res.status);
  
  if (!res.ok) throw new Error(`getReportByJob: ${res.status}`);
  
  const data = await res.json();
  console.log("Data recibida:", data);
  return data;
}

export async function listLista({ estado, fechaDesde, fechaHasta, q } = {}) {
  const qs = new URLSearchParams();
  if (estado && estado !== "Todos") qs.set("estado", estado);
  if (fechaDesde) qs.set("fecha_desde", fechaDesde);
  if (fechaHasta) qs.set("fecha_hasta", fechaHasta);
  if (q && q.trim()) qs.set("q", q.trim());
  
  const url = `${BASE}/lista${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`listLista: ${res.status}`);
  return res.json();
}

export async function updateListaEstado(id, { estado, mensaje_error } = {}) {
  const res = await fetch(`${BASE}/lista/${id}/estado`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado, mensaje_error: mensaje_error ?? null }),
  });
  if (!res.ok) throw new Error(`updateListaEstado: ${res.status}`);
  return res.json();
}

// ===== NUEVAS FUNCIONES PARA SISTEMA DE TRACKING =====

export async function getPaginasDisponibles() {
  /**
   * Obtiene todas las páginas disponibles para consulta.
   * Se usa para mostrar los checkboxes en el selector de páginas.
   */
  const res = await fetch(`${BASE}/tracking/paginas`);
  if (!res.ok) throw new Error(`getPaginasDisponibles: ${res.status}`);
  return res.json();
}

export async function getClientesConTracking({ estado, fechaDesde, fechaHasta, q } = {}) {
  /**
   * Obtiene clientes con información de tracking mejorado.
   * Incluye proceso activo si existe.
   */
  const qs = new URLSearchParams();
  if (estado && estado !== "Todos") qs.set("estado", estado);
  if (fechaDesde) qs.set("fecha_desde", fechaDesde);
  if (fechaHasta) qs.set("fecha_hasta", fechaHasta);
  if (q && q.trim()) qs.set("q", q.trim());
  
  const url = `${BASE}/tracking/clientes${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`getClientesConTracking: ${res.status}`);
  return res.json();
}

export async function crearProcesoConPaginas(clienteId, paginasCodigos, opciones = {}) {
  /**
   * Crea un nuevo proceso para un cliente con las páginas seleccionadas.
   * 
   * @param {number} clienteId - ID del cliente
   * @param {string[]} paginasCodigos - Array de códigos de páginas ['ruc', 'deudas', etc.]
   * @param {Object} opciones - Opciones adicionales
   */
  const body = {
    cliente_id: clienteId,
    paginas_codigos: paginasCodigos,
    headless: opciones.headless || false,
    generate_report: opciones.generateReport !== false, // true por defecto
  };

  const res = await fetch(`${BASE}/tracking/procesos/crear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(`crearProcesoConPaginas: ${res.status} - ${error.detail || 'Error desconocido'}`);
  }
  
  return res.json();
}

export async function updateClienteEstado(clienteId, estado, mensajeError = null) {
  /**
   * Actualiza el estado de un cliente específico.
   */
  const body = {
    estado: estado,
    mensaje_error: mensajeError,
  };

  const res = await fetch(`${BASE}/tracking/clientes/${clienteId}/estado`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) throw new Error(`updateClienteEstado: ${res.status}`);
  return res.json();
}

export async function checkSystemHealth() {
  /**
   * Verifica el health del sistema de tracking.
   */
  const res = await fetch(`${BASE}/tracking/health`);
  if (!res.ok) throw new Error(`checkSystemHealth: ${res.status}`);
  return res.json();
}

// ===== UTILIDADES PARA UI =====

export function formatearEstadoConsulta(estado) {
  /**
   * Formatea el estado de una consulta individual para mostrar en UI.
   */
  const estados = {
    'Pendiente': { texto: 'Pendiente', color: 'gray', icono: '⏳' },
    'En_Proceso': { texto: 'Procesando', color: 'blue', icono: '🔄' },
    'Exitosa': { texto: 'Exitosa', color: 'green', icono: '✅' },
    'Fallida': { texto: 'Fallida', color: 'red', icono: '❌' }
  };
  
  return estados[estado] || { texto: estado, color: 'gray', icono: '❓' };
}

export function formatearEstadoProceso(estado) {
  /**
   * Formatea el estado de un proceso completo para mostrar en UI.
   */
  const estados = {
    'Pendiente': { texto: 'Pendiente', color: 'gray', icono: '⏳' },
    'En_Proceso': { texto: 'En Proceso', color: 'blue', icono: '🔄' },
    'Completado': { texto: 'Completado', color: 'green', icono: '✅' },
    'Completado_Con_Errores': { texto: 'Completado con Errores', color: 'yellow', icono: '⚠️' },
    'Error_Total': { texto: 'Error Total', color: 'red', icono: '❌' }
  };
  
  return estados[estado] || { texto: estado, color: 'gray', icono: '❓' };
}

// ===== CONFIGURACIÓN Y CONSTANTES =====

export const TIPOS_PAGINA = {
  ruc: { nombre: 'SRI - RUC', requiere: 'RUC' },
  deudas: { nombre: 'SRI - Deudas', requiere: 'RUC' },
  denuncias: { nombre: 'Fiscalía - Denuncias', requiere: 'CI' },
  interpol: { nombre: 'INTERPOL', requiere: 'Nombres/Apellidos' },
  mercado_valores: { nombre: 'Mercado de Valores', requiere: 'RUC/CI' },
  google: { nombre: 'Google', requiere: 'Texto libre' },
  contraloria: { nombre: 'Contraloría', requiere: 'CI' },
  supercias_persona: { nombre: 'Superintendencia', requiere: 'CI' },
  predio_quito: { nombre: 'Predios Quito', requiere: 'CI' },
  predio_manta: { nombre: 'Predios Manta', requiere: 'CI' }
};

export const ESTADOS_CLIENTE = ['Pendiente', 'Procesando', 'Procesado', 'Error'];

// ===== FUNCIÓN DE DEBUG =====
export function getApiBase() {
  return BASE;
}