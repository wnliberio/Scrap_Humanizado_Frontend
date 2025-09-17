// src/lib/api.js - VERSIÓN COMPLETA CON TODAS LAS FUNCIONES NECESARIAS
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

console.log('📡 API cargada - Base URL:', BASE);

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

export async function getReportByJob(jobId) {
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
  console.log('🔍 Obteniendo páginas disponibles...');
  const res = await fetch(`${BASE}/tracking/paginas`);
  if (!res.ok) throw new Error(`getPaginasDisponibles: ${res.status}`);
  const data = await res.json();
  console.log('✅ Páginas obtenidas:', data.length);
  return data;
}

export async function getClientesConTracking({ estado, fechaDesde, fechaHasta, q } = {}) {
  console.log('🔍 Obteniendo clientes con tracking...');
  const qs = new URLSearchParams();
  if (estado && estado !== "Todos") qs.set("estado", estado);
  if (fechaDesde) qs.set("fecha_desde", fechaDesde);
  if (fechaHasta) qs.set("fecha_hasta", fechaHasta);
  if (q && q.trim()) qs.set("q", q.trim());
  
  const url = `${BASE}/tracking/clientes${qs.toString() ? `?${qs.toString()}` : ""}`;
  console.log('📡 URL:', url);
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`getClientesConTracking: ${res.status}`);
  
  const data = await res.json();
  console.log('✅ Clientes obtenidos:', data.length);
  return data;
}

export async function updateClienteEstado(clienteId, estado, mensajeError = null) {
  console.log(`🔄 Actualizando cliente ${clienteId} a estado: ${estado}`);
  const res = await fetch(`${BASE}/tracking/clientes/${clienteId}/estado`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      estado, 
      mensaje_error: mensajeError 
    }),
  });
  if (!res.ok) throw new Error(`updateClienteEstado: ${res.status}`);
  return res.json();
}

export async function crearProcesoConPaginas(clienteId, paginasCodigos, opciones = {}) {
  console.log(`🚀 Creando proceso para cliente ${clienteId} con páginas:`, paginasCodigos);
  
  const body = {
    cliente_id: clienteId,
    paginas_codigos: paginasCodigos,
    headless: opciones.headless || false,
    generate_report: opciones.generateReport !== false,
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
  
  const data = await res.json();
  console.log('✅ Proceso creado:', data);
  return data;
}

// ===== FUNCIONES DE FORMATEO (NECESARIAS PARA MODALES) =====

export function formatearEstadoConsulta(estado) {
  /**
   * Formatea el estado de una consulta individual para mostrar en UI.
   * NECESARIA PARA ModalDetallesMejorado.jsx
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
    'Pendiente': { texto: 'Pendiente', color: '#f59e0b', icono: '⏳' },
    'En_Proceso': { texto: 'En Proceso', color: '#3b82f6', icono: '🔄' },
    'Completado': { texto: 'Completado', color: '#10b981', icono: '✅' },
    'Completado_Con_Errores': { texto: 'Completado con Errores', color: '#f59e0b', icono: '⚠️' },
    'Error_Total': { texto: 'Error Total', color: '#ef4444', icono: '❌' }
  };
  
  return estados[estado] || { texto: estado, color: '#6b7280', icono: '❓' };
}

// ===== CONFIGURACIÓN DE PÁGINAS =====

export const TIPOS_PAGINA = {
  interpol: { nombre: 'INTERPOL', requiere: ['Apellidos'] },
  supercias_persona: { nombre: 'Supercias Personas', requiere: ['CI'] },
  ruc: { nombre: 'SRI - RUC', requiere: ['RUC'] },
  google: { nombre: 'Google', requiere: ['Nombres'] },
  contraloria: { nombre: 'Contraloría', requiere: ['CI'] },
  mercado_valores: { nombre: 'Mercado Valores', requiere: ['RUC'] },
  denuncias: { nombre: 'Fiscalía - Denuncias', requiere: ['Nombres'] },
  deudas: { nombre: 'SRI - Deudas', requiere: ['RUC'] },
  predio_quito: { nombre: 'Predios Quito', requiere: ['CI'] },
  predio_manta: { nombre: 'Predios Manta', requiere: ['CI'] }
};

// ===== FUNCIONES DE DEBUGGING =====

export async function probarConexionTracking() {
  try {
    console.log('🔍 Probando conexión tracking...');
    const res = await fetch(`${BASE}/tracking/health`);
    if (!res.ok) throw new Error(`Health check: ${res.status}`);
    const data = await res.json();
    console.log('✅ Conexión tracking OK:', data);
    return data;
  } catch (error) {
    console.error('❌ Error conexión tracking:', error);
    throw error;
  }
}

export async function diagnosticarSistema() {
  try {
    console.log('🔍 Ejecutando diagnóstico completo...');
    const res = await fetch(`${BASE.replace('/api', '')}/api/diagnostico`);
    if (!res.ok) throw new Error(`Diagnóstico: ${res.status}`);
    const data = await res.json();
    console.log('✅ Diagnóstico completo:', data);
    return data;
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    throw error;
  }
}

// ===== EXPORTAR DEBUGGING AL WINDOW =====
if (typeof window !== 'undefined') {
  window.sistemaDebug = {
    diagnosticar: diagnosticarSistema,
    probarTracking: probarConexionTracking,
    base: BASE,
    testClientes: () => getClientesConTracking(),
    testPaginas: () => getPaginasDisponibles()
  };
}

console.log('✅ API completa cargada correctamente');