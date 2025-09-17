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
// FUNCIONES ADICIONALES PARA api.js - AÑADIR AL FINAL DEL ARCHIVO EXISTENTE

// ===== NUEVAS FUNCIONES PARA MODALDETALLESMEJORADO =====

/**
 * Obtiene los detalles completos de un proceso específico
 * @param {string} procesoId - ID del proceso
 * @returns {Promise<Object>} Detalles del proceso con consultas
 */
export async function obtenerDetallesProceso(procesoId) {
  console.log(`🔍 Obteniendo detalles del proceso ${procesoId}...`);
  
  const res = await fetch(`${BASE}/tracking/procesos/${procesoId}/detalles`);
  if (!res.ok) {
    throw new Error(`obtenerDetallesProceso: ${res.status}`);
  }
  
  const data = await res.json();
  console.log('✅ Detalles del proceso obtenidos:', data);
  return data;
}

/**
 * Obtiene todos los reportes disponibles para un cliente específico
 * @param {number} clienteId - ID del cliente
 * @returns {Promise<Array>} Lista de reportes del cliente
 */
export async function obtenerReportesCliente(clienteId) {
  console.log(`🔍 Obteniendo reportes del cliente ${clienteId}...`);
  
  const res = await fetch(`${BASE}/tracking/clientes/${clienteId}/reportes`);
  if (!res.ok) {
    // Si no existe el endpoint o el cliente no tiene reportes, retornar array vacío
    if (res.status === 404) {
      console.log('ℹ️ No se encontraron reportes para el cliente');
      return [];
    }
    throw new Error(`obtenerReportesCliente: ${res.status}`);
  }
  
  const data = await res.json();
  console.log(`✅ Reportes del cliente obtenidos: ${data.length} reportes`);
  return data;
}

/**
 * Descarga un reporte específico por proceso ID
 * @param {string} procesoId - ID del proceso
 * @returns {Promise<Blob>} Archivo del reporte
 */
export async function descargarReportePorProceso(procesoId) {
  console.log(`📥 Descargando reporte del proceso ${procesoId}...`);
  
  const res = await fetch(`${BASE}/tracking/reportes/${procesoId}/download`);
  if (!res.ok) {
    throw new Error(`descargarReportePorProceso: ${res.status} - No se pudo descargar el reporte`);
  }
  
  const blob = await res.blob();
  console.log('✅ Reporte descargado exitosamente');
  return blob;
}

/**
 * Obtiene la URL directa para descargar un reporte
 * @param {string} procesoId - ID del proceso
 * @returns {string} URL de descarga
 */
export function obtenerUrlDescargaReporte(procesoId) {
  return `${BASE}/tracking/reportes/${procesoId}/download`;
}

/**
 * Descarga un reporte y crea automáticamente el enlace de descarga
 * @param {string} procesoId - ID del proceso
 * @param {string} nombreCliente - Nombre del cliente para el archivo
 * @returns {Promise<boolean>} True si la descarga fue exitosa
 */
export async function descargarReporteAutomatico(procesoId, nombreCliente = 'cliente') {
  try {
    console.log(`🚀 Iniciando descarga automática para proceso ${procesoId}...`);
    
    const response = await fetch(`${BASE}/tracking/reportes/${procesoId}/download`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudo descargar el reporte`);
    }

    // Crear blob del archivo
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Crear enlace de descarga automático
    const link = document.createElement('a');
    link.href = url;
    
    // Determinar nombre del archivo
    let filename = 'reporte.docx';
    const disposition = response.headers.get('Content-Disposition');
    if (disposition) {
      const filenameMatch = disposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    } else {
      // Generar nombre basado en cliente y fecha
      const fecha = new Date().toISOString().split('T')[0];
      filename = `reporte_${nombreCliente.replace(/\s+/g, '_')}_${fecha}.docx`;
    }
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Descarga automática completada:', filename);
    return true;
    
  } catch (error) {
    console.error('❌ Error en descarga automática:', error);
    throw error;
  }
}

/**
 * Verifica el estado de un reporte para un proceso
 * @param {string} procesoId - ID del proceso
 * @returns {Promise<Object>} Estado del reporte
 */
export async function verificarEstadoReporte(procesoId) {
  console.log(`🔍 Verificando estado del reporte para proceso ${procesoId}...`);
  
  const res = await fetch(`${BASE}/tracking/reportes/${procesoId}/estado`);
  if (!res.ok) {
    if (res.status === 404) {
      return { existe: false, generado: false };
    }
    throw new Error(`verificarEstadoReporte: ${res.status}`);
  }
  
  const data = await res.json();
  console.log('✅ Estado del reporte verificado:', data);
  return data;
}

/**
 * Formatea los datos del proceso para mostrar en el modal
 * @param {Object} procesoActivo - Datos del proceso activo
 * @returns {Object} Datos formateados para el modal
 */
export function formatearDatosProceso(procesoActivo) {
  if (!procesoActivo) return null;

  return {
    ...procesoActivo,
    // Asegurar que consultas sea siempre un array
    consultas: procesoActivo.consultas || [],
    
    // Formatear fechas si existen
    fecha_creacion_formateada: procesoActivo.fecha_creacion ? 
      new Date(procesoActivo.fecha_creacion).toLocaleString('es-EC') : null,
    
    fecha_completado_formateada: procesoActivo.fecha_completado ? 
      new Date(procesoActivo.fecha_completado).toLocaleString('es-EC') : null,
    
    // Calcular estadísticas
    estadisticas: calcularEstadisticasProceso(procesoActivo.consultas || [])
  };
}

/**
 * Calcula estadísticas de un proceso basado en sus consultas
 * @param {Array} consultas - Array de consultas del proceso
 * @returns {Object} Estadísticas calculadas
 */
export function calcularEstadisticasProceso(consultas) {
  if (!Array.isArray(consultas)) {
    return { total: 0, exitosas: 0, fallidas: 0, pendientes: 0, porcentajeExito: 0 };
  }

  const total = consultas.length;
  const exitosas = consultas.filter(c => c.estado === 'Exitosa').length;
  const fallidas = consultas.filter(c => c.estado === 'Fallida').length;
  const pendientes = consultas.filter(c => c.estado === 'Pendiente' || c.estado === 'En_Proceso').length;
  
  return {
    total,
    exitosas,
    fallidas,
    pendientes,
    porcentajeExito: total > 0 ? Math.round((exitosas / total) * 100) : 0
  };
}

/**
 * Función helper para manejar errores de descarga
 * @param {Error} error - Error capturado
 * @param {string} procesoId - ID del proceso que falló
 * @returns {string} Mensaje de error formateado
 */
export function formatearErrorDescarga(error, procesoId) {
  console.error(`❌ Error descargando reporte ${procesoId}:`, error);
  
  if (error.message.includes('404')) {
    return 'El reporte no existe o aún no ha sido generado';
  } else if (error.message.includes('500')) {
    return 'Error interno del servidor al generar el reporte';
  } else if (error.message.includes('403')) {
    return 'No tienes permisos para descargar este reporte';
  } else {
    return `Error inesperado: ${error.message}`;
  }
}

// ===== FUNCIONES DE DEBUGGING ESPECÍFICAS PARA EL MODAL =====

/**
 * Prueba todas las funciones relacionadas con el modal
 * @param {number} clienteId - ID del cliente para probar
 * @returns {Promise<Object>} Resultados de las pruebas
 */
export async function probarFuncionesModal(clienteId) {
  console.log('🧪 Probando funciones del modal...');
  const resultados = {};
  
  try {
    // Probar obtención de cliente
    console.log('1. Probando getClientesConTracking...');
    const clientes = await getClientesConTracking();
    resultados.clientes = { exito: true, cantidad: clientes.length };
    
    // Probar obtención de reportes
    console.log('2. Probando obtenerReportesCliente...');
    const reportes = await obtenerReportesCliente(clienteId);
    resultados.reportes = { exito: true, cantidad: reportes.length };
    
    console.log('✅ Todas las pruebas del modal completadas');
    return resultados;
    
  } catch (error) {
    console.error('❌ Error en pruebas del modal:', error);
    resultados.error = error.message;
    return resultados;
  }
}

// ===== AGREGAR AL WINDOW PARA DEBUGGING =====
if (typeof window !== 'undefined') {
  // Añadir al objeto sistemaDebug existente
  window.sistemaDebug = {
    ...window.sistemaDebug,
    modal: {
      probarFunciones: probarFuncionesModal,
      descargarReporte: descargarReporteAutomatico,
      verificarEstado: verificarEstadoReporte,
      obtenerReportes: obtenerReportesCliente,
      formatearProceso: formatearDatosProceso
    }
  };
}

console.log('✅ Funciones del modal añadidas correctamente');