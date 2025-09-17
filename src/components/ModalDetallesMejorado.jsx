// src/components/ModalDetallesMejorado.jsx - CON BOTÓN DE DESCARGA Y RESUMEN
import React, { useState, useEffect } from 'react';
import { formatearEstadoConsulta } from '../lib/api.js';

const ModalDetallesMejorado = ({ 
  cliente, 
  isVisible, 
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detallesProceso, setDetallesProceso] = useState(null);
  const [reportesDisponibles, setReportesDisponibles] = useState([]);

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'N/A';
    return new Date(fechaISO).toLocaleString('es-EC', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Cargar detalles del proceso y reportes cuando el modal se abre
  useEffect(() => {
    if (isVisible && cliente && cliente.proceso_activo) {
      cargarDetallesProceso();
      cargarReportesCliente();
    }
  }, [isVisible, cliente]);

  const cargarDetallesProceso = async () => {
    if (!cliente?.proceso_activo?.proceso_id) return;

    try {
      setLoading(true);
      // Llamar al endpoint de detalles de proceso (cuando esté implementado)
      // Por ahora usamos los datos que ya tenemos
      setDetallesProceso(cliente.proceso_activo);
    } catch (err) {
      console.error('Error cargando detalles del proceso:', err);
      setError('Error cargando detalles del proceso');
    } finally {
      setLoading(false);
    }
  };

  const cargarReportesCliente = async () => {
    if (!cliente?.id) return;

    try {
      const response = await fetch(`/api/tracking/clientes/${cliente.id}/reportes`);
      if (response.ok) {
        const reportes = await response.json();
        setReportesDisponibles(reportes);
      }
    } catch (err) {
      console.error('Error cargando reportes:', err);
    }
  };

  const descargarReporte = async (procesoId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tracking/reportes/${procesoId}/download`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo descargar el reporte`);
      }

      // Crear descarga automática
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `reporte_proceso_${procesoId}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Mostrar mensaje de éxito
      alert('Reporte descargado exitosamente');
    } catch (err) {
      console.error('Error descargando reporte:', err);
      alert(`Error descargando reporte: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Generar resumen de páginas basado en el proceso activo
  const generarResumenPaginas = () => {
    if (!detallesProceso) return null;

    const totalSolicitadas = detallesProceso.total_paginas_solicitadas || 0;
    const exitosas = detallesProceso.total_paginas_exitosas || 0;
    const fallidas = detallesProceso.total_paginas_fallidas || 0;

    return {
      total: totalSolicitadas,
      exitosas,
      fallidas,
      porcentajeExito: totalSolicitadas > 0 ? Math.round((exitosas / totalSolicitadas) * 100) : 0
    };
  };

  const resumenPaginas = generarResumenPaginas();

  if (!isVisible || !cliente) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Detalles del Cliente
            </h2>
            <p className="text-blue-100 mt-1">
              {cliente.nombre} {cliente.apellido}
              {cliente.ruc && ` - RUC: ${cliente.ruc}`}
              {cliente.ci && ` - CI: ${cliente.ci}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 text-3xl font-light transition-colors"
          >
            ×
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Información básica del cliente */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Información del Cliente</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                <p className="mt-1 text-sm text-gray-900 font-medium">{cliente.nombre} {cliente.apellido}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cédula</label>
                <p className="mt-1 text-sm text-gray-900">{cliente.ci || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">RUC</label>
                <p className="mt-1 text-sm text-gray-900">{cliente.ruc || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <p className="mt-1 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    cliente.estado === 'Procesado' ? 'bg-green-100 text-green-800' :
                    cliente.estado === 'Procesando' ? 'bg-blue-100 text-blue-800' :
                    cliente.estado === 'Error' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cliente.estado}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Alerta</label>
                <p className="mt-1 text-sm text-gray-900">{cliente.tipo || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Monto</label>
                <p className="mt-1 text-sm text-gray-900 font-semibold text-green-600">
                  {cliente.monto ? `$${cliente.monto.toLocaleString()}` : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha Evento</label>
                <p className="mt-1 text-sm text-gray-900">{cliente.fecha || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Registrado</label>
                <p className="mt-1 text-sm text-gray-900">{formatearFecha(cliente.fecha_creacion)}</p>
              </div>
            </div>
          </div>

          {/* Proceso activo (si existe) */}
          {cliente.proceso_activo && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Proceso Activo</h3>
                {cliente.estado === 'Procesado' && reportesDisponibles.length > 0 && (
                  <button
                    onClick={() => descargarReporte(cliente.proceso_activo.proceso_id)}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Descargando...
                      </>
                    ) : (
                      <>
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Descargar Reporte
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Job ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 p-1 rounded">
                    {cliente.proceso_activo.job_id}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado del Proceso</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      cliente.proceso_activo.estado === 'Completado' ? 'bg-green-100 text-green-800' :
                      cliente.proceso_activo.estado === 'En_Proceso' ? 'bg-blue-100 text-blue-800' :
                      cliente.proceso_activo.estado === 'Completado_Con_Errores' ? 'bg-yellow-100 text-yellow-800' :
                      cliente.proceso_activo.estado === 'Error_Total' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {cliente.proceso_activo.estado}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duración</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {cliente.proceso_activo.fecha_inicio && cliente.proceso_activo.fecha_fin
                      ? `${Math.round((new Date(cliente.proceso_activo.fecha_fin) - new Date(cliente.proceso_activo.fecha_inicio)) / 1000 / 60)} min`
                      : 'En proceso...'}
                  </p>
                </div>
              </div>

              {/* RESUMEN DE PÁGINAS CONSULTADAS */}
              {resumenPaginas && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Resumen de Consultas</h4>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">{resumenPaginas.total}</div>
                      <div className="text-xs text-gray-600">Total Solicitadas</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-green-600">{resumenPaginas.exitosas}</div>
                      <div className="text-xs text-gray-600">Exitosas</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-red-600">{resumenPaginas.fallidas}</div>
                      <div className="text-xs text-gray-600">Fallidas</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-purple-600">{resumenPaginas.porcentajeExito}%</div>
                      <div className="text-xs text-gray-600">Éxito</div>
                    </div>
                  </div>
                  
                  {/* Mensaje informativo sobre páginas fallidas */}
                  {resumenPaginas.fallidas > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            <strong>Atención:</strong> {resumenPaginas.fallidas} página(s) fallaron durante la consulta. 
                            Revise manualmente estas páginas para completar la información en el reporte.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mensaje si no hay proceso activo */}
          {!cliente.proceso_activo && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <p className="text-gray-600 text-lg">No hay procesos activos para este cliente</p>
              <p className="text-gray-500 text-sm mt-2">
                Use "Seleccionar Páginas" para iniciar un nuevo proceso de consulta
              </p>
            </div>
          )}

          {/* Información de reportes disponibles */}
          {reportesDisponibles.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-md font-semibold text-blue-800 mb-2">Reportes Disponibles</h4>
              <div className="space-y-2">
                {reportesDisponibles.map((reporte) => (
                  <div key={reporte.id} className="flex justify-between items-center bg-white p-3 rounded border">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{reporte.nombre_archivo}</p>
                      <p className="text-xs text-gray-500">
                        Generado: {formatearFecha(reporte.fecha_generacion)}
                        {reporte.tamano_bytes && ` • ${Math.round(reporte.tamano_bytes / 1024)} KB`}
                      </p>
                    </div>
                    <button
                      onClick={() => descargarReporte(reporte.proceso_id)}
                      disabled={loading}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Descargar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetallesMejorado;