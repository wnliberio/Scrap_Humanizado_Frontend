// src/components/ModalDetallesMejorado.jsx - MODAL MEJORADO SIMPLIFICADO
import React, { useState, useEffect } from 'react';
import { formatearEstadoConsulta } from '../lib/api.js';

const ModalDetallesMejorado = ({ 
  cliente, 
  isVisible, 
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  if (!isVisible || !cliente) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Detalles del Cliente
            </h2>
            <p className="text-gray-600 mt-1">
              {cliente.nombre} {cliente.apellido}
              {cliente.ruc && ` - RUC: ${cliente.ruc}`}
              {cliente.ci && ` - CI: ${cliente.ci}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl font-light"
          >
            ×
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Información básica del cliente */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Información del Cliente</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                <p className="mt-1 text-sm text-gray-900">{cliente.nombre} {cliente.apellido}</p>
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
                    'bg-gray-100 text-gray-800'
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
                <p className="mt-1 text-sm text-gray-900">
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
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Proceso Activo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Job ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{cliente.proceso_activo.job_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      cliente.proceso_activo.estado === 'Completado' ? 'bg-green-100 text-green-800' :
                      cliente.proceso_activo.estado === 'En_Proceso' ? 'bg-blue-100 text-blue-800' :
                      cliente.proceso_activo.estado === 'Error_Total' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formatearEstadoConsulta(cliente.proceso_activo.estado)}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Iniciado</label>
                  <p className="mt-1 text-sm text-gray-900">{formatearFecha(cliente.proceso_activo.fecha_inicio)}</p>
                </div>
              </div>
              
              {/* Progreso del proceso */}
              {cliente.proceso_activo.progreso && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Progreso</label>
                    <span className="text-sm text-gray-600">
                      {cliente.proceso_activo.progreso.completadas}/{cliente.proceso_activo.progreso.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(cliente.proceso_activo.progreso.completadas / cliente.proceso_activo.progreso.total) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Consultas realizadas */}
          {cliente.consultas && cliente.consultas.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Consultas Realizadas</h3>
              <div className="space-y-3">
                {cliente.consultas.map((consulta, index) => (
                  <div key={index} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{consulta.tipo}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        consulta.estado === 'completada' ? 'bg-green-100 text-green-800' :
                        consulta.estado === 'procesando' ? 'bg-blue-100 text-blue-800' :
                        consulta.estado === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {consulta.estado}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Valor consultado: <span className="font-mono">{consulta.valor}</span>
                    </p>
                    {consulta.resultado && (
                      <div className="text-sm">
                        <p className="text-gray-700">
                          <strong>Resultado:</strong> {consulta.resultado.resumen || 'Datos encontrados'}
                        </p>
                        {consulta.resultado.detalles && (
                          <p className="text-gray-600 mt-1">
                            {consulta.resultado.detalles}
                          </p>
                        )}
                      </div>
                    )}
                    {consulta.error && (
                      <p className="text-sm text-red-600 mt-2">
                        <strong>Error:</strong> {consulta.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reportes generados */}
          {cliente.reportes && cliente.reportes.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Reportes Generados</h3>
              <div className="space-y-3">
                {cliente.reportes.map((reporte, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{reporte.nombre}</h4>
                      <p className="text-sm text-gray-600">
                        Generado: {formatearFecha(reporte.fecha_creacion)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => window.open(reporte.url_descarga, '_blank')}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Descargar
                      </button>
                      <button 
                        onClick={() => window.open(reporte.url_preview, '_blank')}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje si no hay datos adicionales */}
          {(!cliente.proceso_activo && (!cliente.consultas || cliente.consultas.length === 0) && (!cliente.reportes || cliente.reportes.length === 0)) && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">📋</div>
              <p className="text-gray-600">No hay procesos o consultas adicionales para mostrar</p>
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