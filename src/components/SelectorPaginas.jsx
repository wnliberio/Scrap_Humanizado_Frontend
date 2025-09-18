// src/components/SelectorPaginas.jsx - COMPONENTE PARA SELECCIÓN DE PÁGINAS
import React, { useState, useEffect } from 'react';
import { 
  getPaginasDisponibles, 
  crearProcesoConPaginas,
  TIPOS_PAGINA 
} from '../lib/api.js';

const SelectorPaginas = ({ 
  cliente, 
  onProcesoCreado, 
  onCancelar, 
  isVisible = false 
}) => {
  const [paginas, setPaginas] = useState([]);
  const [paginasSeleccionadas, setPaginasSeleccionadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [headless, setHeadless] = useState(false);
  const [generateReport, setGenerateReport] = useState(true);

  // Cargar páginas disponibles
  useEffect(() => {
    if (isVisible) {
      cargarPaginas();
    }
  }, [isVisible]);

  const cargarPaginas = async () => {
    try {
      setLoading(true);
      const paginasData = await getPaginasDisponibles();
      setPaginas(paginasData);
      setError(null);
    } catch (err) {
      setError(`Error cargando páginas: ${err.message}`);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaginaToggle = (codigoPagina) => {
    setPaginasSeleccionadas(prev => {
      if (prev.includes(codigoPagina)) {
        return prev.filter(codigo => codigo !== codigoPagina);
      } else {
        return [...prev, codigoPagina];
      }
    });
  };

  const handleSeleccionarTodas = () => {
    if (paginasSeleccionadas.length === paginas.length) {
      setPaginasSeleccionadas([]);
    } else {
      setPaginasSeleccionadas(paginas.map(p => p.codigo));
    }
  };

  const handleCrearProceso = async () => {
    if (paginasSeleccionadas.length === 0) {
      setError('Selecciona al menos una página para consultar');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const resultado = await crearProcesoConPaginas(
        cliente.id,
        paginasSeleccionadas,
        {
          headless,
          generateReport
        }
      );

      console.log('✅ Proceso creado:', resultado);

      // Notificar al componente padre
      if (onProcesoCreado) {
        onProcesoCreado(resultado);
      }

      // Limpiar selección
      setPaginasSeleccionadas([]);
      
    } catch (err) {
      setError(`Error creando proceso: ${err.message}`);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIconoPagina = (codigo) => {
    const iconos = {
      ruc: '📊',
      deudas: '💰',
      denuncias: '⚖️',
      interpol: '🌐',
      mercado_valores: '📈',
      google: '🔍',
      contraloria: '📋',
      supercias_persona: '👤',
      predio_quito: '🏠',
      predio_manta: '🏖️',
      funcion_judicial: '🏛️'
    };
    return iconos[codigo] || '📄';
  };

  const getRequisitosPagina = (codigo) => {
    const info = TIPOS_PAGINA[codigo];
    if (!info) return 'Datos del cliente';
    
    // Verificar si el cliente tiene los datos necesarios
    const requisitos = [];
    if (info.requiere.includes('RUC') && cliente.ruc) {
      requisitos.push(`RUC: ${cliente.ruc}`);
    }
    if (info.requiere.includes('CI') && cliente.ci) {
      requisitos.push(`CI: ${cliente.ci}`);
    }
    if (info.requiere.includes('Nombres') && (cliente.nombre || cliente.apellido)) {
      requisitos.push(`Nombre: ${cliente.nombre} ${cliente.apellido}`.trim());
    }
    
    return requisitos.length > 0 ? requisitos.join(', ') : info.requiere;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Seleccionar Páginas para Consultar
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Cliente: <span className="font-medium">
                {cliente.nombre} {cliente.apellido} 
                {cliente.ruc && ` - RUC: ${cliente.ruc}`}
                {cliente.ci && ` - CI: ${cliente.ci}`}
              </span>
            </p>
          </div>
          <button
            onClick={onCancelar}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Controles superiores */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <button
            onClick={handleSeleccionarTodas}
            className="text-blue-600 hover:text-blue-800 font-medium"
            disabled={loading}
          >
            {paginasSeleccionadas.length === paginas.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
          </button>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={headless}
              onChange={(e) => setHeadless(e.target.checked)}
              disabled={loading}
            />
            <span className="text-sm">Ejecutar headless (sin ventana visible)</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={generateReport}
              onChange={(e) => setGenerateReport(e.target.checked)}
              disabled={loading}
            />
            <span className="text-sm">Generar reporte al finalizar</span>
          </label>
        </div>

        {/* Lista de páginas */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando páginas disponibles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {paginas.map((pagina) => {
              const isSelected = paginasSeleccionadas.includes(pagina.codigo);
              
              return (
                <div
                  key={pagina.codigo}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handlePaginaToggle(pagina.codigo)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">{getIconoPagina(pagina.codigo)}</div>
                      <div className="text-center mt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Manejado por el div padre
                          className="rounded"
                        />
                      </div>
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {pagina.nombre}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {pagina.descripcion}
                      </p>
                      <p className="text-xs text-gray-500">
                        <strong>Enviará:</strong> {getRequisitosPagina(pagina.codigo)}
                      </p>
                      {pagina.url && (
                        <p className="text-xs text-blue-600 mt-1 truncate">
                          {pagina.url}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resumen de selección */}
        {paginasSeleccionadas.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">
              Páginas seleccionadas ({paginasSeleccionadas.length}):
            </h4>
            <div className="flex flex-wrap gap-2">
              {paginasSeleccionadas.map(codigo => {
                const pagina = paginas.find(p => p.codigo === codigo);
                return (
                  <span
                    key={codigo}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {getIconoPagina(codigo)} {pagina?.nombre || codigo}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancelar}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          
          <button
            onClick={handleCrearProceso}
            disabled={loading || paginasSeleccionadas.length === 0}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              loading || paginasSeleccionadas.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creando Proceso...
              </span>
            ) : (
              `Agregar a Cola (${paginasSeleccionadas.length} páginas)`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectorPaginas;