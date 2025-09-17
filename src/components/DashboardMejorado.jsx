// src/components/DashboardMejorado.jsx - CONECTADO CON MODALDETALLESMEJORADO
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  getClientesConTracking,
  crearProcesoConPaginas,
  updateClienteEstado,
  getPaginasDisponibles,
  TIPOS_PAGINA,
  formatearEstadoProceso
} from '../lib/api';
import ModalDetallesMejorado from './ModalDetallesMejorado';

const DashboardMejorado = () => {
  // Estados principales
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  
  // Estados para el modal nuevo
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [modalDetallesVisible, setModalDetallesVisible] = useState(false);
  
  // Estados para modal de selección de páginas (solo para Pendientes)
  const [modalSeleccion, setModalSeleccion] = useState(null);
  const [checks, setChecks] = useState({
    interpol: false,
    supercias_persona: false,
    ruc: false,
    google: false,
    contraloria: false,
    mercado_valores: false,
    denuncias: false,
    deudas: false,
    predio_quito: false,
    predio_manta: false,
  });

  // Para el sistema de tracking
  const [paginasDisponibles, setPaginasDisponibles] = useState([]);
  
  // Polling automático
  const intervalRef = useRef(null);

  // Cargar datos iniciales
  useEffect(() => {
    cargarClientes();
    cargarPaginasDisponibles();
    
    // Polling cada 5 segundos
    intervalRef.current = setInterval(cargarClientes, 5000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [filtroEstado, busqueda]);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const data = await getClientesConTracking({
        estado: filtroEstado !== 'Todos' ? filtroEstado : undefined,
        q: busqueda.trim() || undefined
      });
      setClientes(data);
      setError(null);
    } catch (err) {
      console.error('Error cargando clientes con tracking:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarPaginasDisponibles = async () => {
    try {
      const paginas = await getPaginasDisponibles();
      console.log('Páginas disponibles desde tracking:', paginas);
      setPaginasDisponibles(paginas.map(p => p.codigo));
    } catch (err) {
      console.error('Error cargando páginas desde tracking:', err);
      setPaginasDisponibles(Object.keys(TIPOS_PAGINA));
    }
  };

  // Estadísticas calculadas
  const estadisticas = useMemo(() => {
    const total = clientes.length;
    const pendientes = clientes.filter(c => c.estado === 'Pendiente').length;
    const procesando = clientes.filter(c => c.estado === 'Procesando').length;
    const procesados = clientes.filter(c => c.estado === 'Procesado').length;
    const errores = clientes.filter(c => c.estado === 'Error').length;
    
    return { total, pendientes, procesando, procesados, errores };
  }, [clientes]);

  // **NUEVA FUNCIÓN: Abrir detalles usando el modal mejorado**
  const abrirDetalles = (cliente) => {
    console.log('🔍 Abriendo detalles para cliente:', cliente);
    
    if (cliente.estado === 'Pendiente') {
      // Para clientes pendientes, mostrar selector de páginas
      setModalSeleccion(cliente);
      // Reset checks
      setChecks({
        interpol: false,
        supercias_persona: false,
        ruc: false,
        google: false,
        contraloria: false,
        mercado_valores: false,
        denuncias: false,
        deudas: false,
        predio_quito: false,
        predio_manta: false,
      });
    } else {
      // Para cualquier otro estado, mostrar el modal de detalles mejorado
      setClienteSeleccionado(cliente);
      setModalDetallesVisible(true);
    }
  };

  const cerrarModalDetalles = () => {
    setModalDetallesVisible(false);
    setClienteSeleccionado(null);
    // Refrescar datos después de cerrar el modal
    cargarClientes();
  };

  const cerrarModalSeleccion = () => {
    setModalSeleccion(null);
    setChecks({
      interpol: false,
      supercias_persona: false,
      ruc: false,
      google: false,
      contraloria: false,
      mercado_valores: false,
      denuncias: false,
      deudas: false,
      predio_quito: false,
      predio_manta: false,
    });
  };

  // Construir items para el proceso (mantenido del código original)
  const buildItemsForRow = (row) => {
    const items = [];
    const nombre = (row.nombre || "").trim();
    const apellido = (row.apellido || "").trim();

    // INTERPOL -> SOLO APELLIDO
    if (checks.interpol) {
      if (!apellido) {
        console.warn("INTERPOL omitido: falta apellido.");
      } else {
        items.push({ tipo: "interpol", valor: apellido, apellidos: apellido });
      }
    }

    // Supercias – Personas (Acciones) -> CI (10)
    if (checks.supercias_persona) {
      if (!/^\d{10}$/.test(row.ci || "")) {
        console.warn("Supercias Persona omitido: CI inválida o ausente.");
      } else {
        items.push({ tipo: "supercias_persona", valor: row.ci });
      }
    }

    // RUC -> RUC (13)
    if (checks.ruc) {
      if (!/^\d{13}$/.test(row.ruc || "")) {
        console.warn("RUC omitido: RUC inválido o ausente.");
      } else {
        items.push({ tipo: "ruc", valor: row.ruc });
      }
    }

    // Google -> Nombre completo
    if (checks.google) {
      if (!nombre || !apellido) {
        console.warn("Google omitido: faltan nombres o apellidos.");
      } else {
        const fullName = `${apellido} ${nombre}`.trim();
        items.push({ tipo: "google", valor: fullName });
      }
    }

    // Contraloría -> CI (10)
    if (checks.contraloria) {
      if (!/^\d{10}$/.test(row.ci || "")) {
        console.warn("Contraloría omitido: CI inválida o ausente.");
      } else {
        items.push({ tipo: "contraloria", valor: row.ci });
      }
    }

    // Mercado de Valores -> RUC (13)
    if (checks.mercado_valores) {
      if (!/^\d{13}$/.test(row.ruc || "")) {
        console.warn("Mercado Valores omitido: RUC inválido o ausente.");
      } else {
        items.push({ tipo: "mercado_valores", valor: row.ruc });
      }
    }

    // Denuncias -> Nombre completo
    if (checks.denuncias) {
      if (!nombre || !apellido) {
        console.warn("Denuncias omitido: faltan nombres o apellidos.");
      } else {
        const fullName = `${apellido} ${nombre}`.trim();
        items.push({ tipo: "denuncias", valor: fullName });
      }
    }

    // Deudas -> RUC (13)
    if (checks.deudas) {
      if (!/^\d{13}$/.test(row.ruc || "")) {
        console.warn("Deudas omitido: RUC inválido o ausente.");
      } else {
        items.push({ tipo: "deudas", valor: row.ruc });
      }
    }

    // Predios Quito/Manta -> CI (10)
    if (checks.predio_quito) {
      if (!/^\d{10}$/.test(row.ci || "")) {
        console.warn("Predio Quito omitido: CI inválida o ausente.");
      } else {
        items.push({ tipo: "predio_quito", valor: row.ci });
      }
    }

    if (checks.predio_manta) {
      if (!/^\d{10}$/.test(row.ci || "")) {
        console.warn("Predio Manta omitido: CI inválida o ausente.");
      } else {
        items.push({ tipo: "predio_manta", valor: row.ci });
      }
    }

    return items;
  };

  // Agregar a cola (ejecutar proceso)
  const handleAgregarACola = async (row) => {
    try {
      const items = buildItemsForRow(row);
      
      if (items.length === 0) {
        alert("No se ha seleccionado ninguna página o faltan datos requeridos.");
        return;
      }

      console.log("Items construidos:", items);
      console.log("Páginas seleccionadas:", items.map(item => item.tipo));

      // Actualizar estado del cliente usando tracking
      await updateClienteEstado(row.id, 'Procesando');

      // Crear proceso usando el sistema de tracking
      const resultado = await crearProcesoConPaginas(
        row.id,
        items.map(item => item.tipo), // Códigos de páginas
        {
          headless: false,
          generateReport: true
        }
      );

      console.log('✅ Proceso de tracking creado:', resultado);
      
      // Mostrar confirmación
      if (resultado.job_id) {
        alert(`Proceso creado exitosamente!
Job ID: ${resultado.job_id}
Proceso ID: ${resultado.proceso_id}
Páginas: ${resultado.paginas_solicitadas.join(', ')}`);
      }

      // Cerrar modal y refrescar
      cerrarModalSeleccion();
      cargarClientes();

    } catch (e) {
      console.error("Error completo en tracking:", e);
      await updateClienteEstado(row.id, 'Error', String(e.message || e));
      alert(`Error creando proceso: ${e.message}`);
      cerrarModalSeleccion();
      cargarClientes();
    }
  };

  // Validar si el cliente puede usar cierta página
  const puedeUsarPagina = (cliente, codigoPagina) => {
    const config = TIPOS_PAGINA[codigoPagina];
    if (!config) return false;

    const requiere = config.requiere;
    if (requiere.includes('RUC') && !cliente.ruc) return false;
    if (requiere.includes('CI') && !cliente.ci) return false;
    if (requiere.includes('Nombres') && (!cliente.nombre || !cliente.apellido)) return false;
    
    return true;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
        Dashboard
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Sistema de consultas con reportes automáticos y seguimiento en tiempo real
        </p>
      </div>

      {/* Filtros */}
      <div style={{ 
        display: 'flex', gap: '16px', marginBottom: '24px', 
        alignItems: 'center', flexWrap: 'wrap',
        backgroundColor: '#888f91ff', color: 'white', padding: '16px', borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <label style={{ fontWeight: '500', marginRight: '8px' }}>Estado:</label>
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          >
            <option value="Todos">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Procesando">Procesando</option>
            <option value="Procesado">Procesado</option>
            <option value="Error">Error</option>
          </select>
        </div>
        
        <div>
          <label style={{ fontWeight: '500', marginRight: '8px' }}>Buscar:</label>
          <input
            type="text"
            placeholder="Nombre, apellido, CI, RUC..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ 
              padding: '8px 12px', border: '1px solid #d1d5db', 
              borderRadius: '6px', minWidth: '300px' 
            }}
          />
        </div>
        
        {/*<button
          onClick={cargarClientes}
          disabled={loading}
          style={{
            padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white',
            border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
        </button>*/}
      </div>

      {/* Estadísticas */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', marginBottom: '24px' 
      }}>
        <div style={{
          backgroundColor: 'white', padding: '20px', borderRadius: '8px',
          border: '2px solid #f59e0b', textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#92400e' }}>
            {estadisticas.pendientes}
          </div>
          <div style={{ fontSize: '14px', color: '#92400e', fontWeight: '500' }}>
            PENDIENTES
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'white', padding: '20px', borderRadius: '8px',
          border: '2px solid #3b82f6', textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e40af' }}>
            {estadisticas.procesando}
          </div>
          <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: '500' }}>
            PROCESANDO
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'white', padding: '20px', borderRadius: '8px',
          border: '2px solid #10b981', textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#065f46' }}>
            {estadisticas.procesados}
          </div>
          <div style={{ fontSize: '14px', color: '#065f46', fontWeight: '500' }}>
            PROCESADOS
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'white', padding: '20px', borderRadius: '8px',
          border: '2px solid #ef4444', textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#991b1b' }}>
            {estadisticas.errores}
          </div>
          <div style={{ fontSize: '14px', color: '#991b1b', fontWeight: '500' }}>
            ERRORES
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div style={{
        backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#58a1e9ff' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                Cliente
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                Documentos
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                Estado
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                Proceso Activo
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                Última Actualización
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(cliente => (
              <tr key={cliente.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                
                {/* Cliente */}
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '500' }}>
                    {cliente.apellido} {cliente.nombre}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    ID: {cliente.id}
                  </div>
                </td>

                {/* Documentos */}
                <td style={{ padding: '16px', fontSize: '14px' }}>
                  <div>CI: {cliente.ci || 'N/A'}</div>
                  <div>RUC: {cliente.ruc || 'N/A'}</div>
                </td>

                {/* Estado */}
                <td style={{ padding: '16px' }}>
                  <span style={{
                    display: 'inline-block', padding: '6px 12px', borderRadius: '20px',
                    fontSize: '12px', fontWeight: '600',
                    backgroundColor: 
                      cliente.estado === 'Procesado' ? '#d1fae5' :
                      cliente.estado === 'Procesando' ? '#dbeafe' :
                      cliente.estado === 'Error' ? '#fee2e2' : '#fef3c7',
                    color:
                      cliente.estado === 'Procesado' ? '#065f46' :
                      cliente.estado === 'Procesando' ? '#1e40af' :
                      cliente.estado === 'Error' ? '#991b1b' : '#92400e'
                  }}>
                    {cliente.estado}
                  </span>
                </td>

                {/* Proceso Activo */}
                <td style={{ padding: '16px', fontSize: '14px' }}>
                  {cliente.proceso_activo ? (
                    <div>
                      <div style={{ fontWeight: '500' }}>
                        ID: {cliente.proceso_activo.proceso_id}
                      </div>
                      <div style={{ color: '#6b7280' }}>
                        Job: {cliente.proceso_activo.job_id || 'N/A'}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>Sin proceso activo</span>
                  )}
                </td>

                {/* Última Actualización */}
                <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                  {cliente.fecha_actualizacion ? 
                    new Date(cliente.fecha_actualizacion).toLocaleString('es-EC') : 
                    'N/A'
                  }
                </td>

                {/* Acciones */}
                <td style={{ padding: '16px' }}>
                  <button
                    onClick={() => abrirDetalles(cliente)}
                    style={{
                      padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white',
                      border: 'none', borderRadius: '6px', cursor: 'pointer',
                      fontSize: '14px', fontWeight: '500'
                    }}
                  >
                    Detalles
                  </button>
                </td>
              </tr>
            ))}
            
            {clientes.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ 
                  padding: '40px', textAlign: 'center', 
                  color: '#9ca3af', fontSize: '16px' 
                }}>
                  {error ? `Error: ${error}` : 'No hay clientes disponibles'}
                </td>
              </tr>
            )}
            
            {/*{loading && (
              <tr>
                <td colSpan={6} style={{ 
                  padding: '40px', textAlign: 'center', 
                  color: '#6b7280', fontSize: '16px' 
                }}>
                  🔄 Cargando clientes...
                </td>
              </tr>
            )}*/}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalles Mejorado */}
      <ModalDetallesMejorado
        cliente={clienteSeleccionado}
        isVisible={modalDetallesVisible}
        onClose={cerrarModalDetalles}
      />

      {/* Modal de Selección de Páginas (solo para Pendientes) */}
      {modalSeleccion && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '24px',
            maxWidth: '800px', width: '90%', maxHeight: '80vh', overflow: 'auto'
          }}>
            
            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                Seleccionar Páginas a Consultar
              </h3>
              <button 
                onClick={cerrarModalSeleccion}
                style={{ 
                  background: 'transparent', border: 'none', fontSize: '24px',
                  cursor: 'pointer', color: '#6b7280' 
                }}
              >
                ×
              </button>
            </div>

            {/* Info del cliente */}
            <div style={{
              backgroundColor: '#1c9df2ff', border: '1px solid #2594c7ff',
              padding: '16px', borderRadius: '8px', marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                Cliente seleccionado:
              </div>
              <div>Nombre: {modalSeleccion.apellido} {modalSeleccion.nombre}</div>
              <div>CI: {modalSeleccion.ci || 'N/A'} • RUC: {modalSeleccion.ruc || 'N/A'}</div>
            </div>

{/* Grid de páginas - MEJORADO PARA LEGIBILIDAD */}
            <div style={{
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', // Más ancho
              gap: '16px', // Gap más grande
              marginBottom: '24px'
            }}>
              {Object.entries(TIPOS_PAGINA).map(([codigo, config]) => {
                const habilitada = puedeUsarPagina(modalSeleccion, codigo);
                return (
                  <div
                    key={codigo}
                    style={{
                      display: 'flex', 
                      alignItems: 'flex-start', // Cambio para mejor alineación
                      padding: '16px', // Padding más generoso
                      border: '2px solid', 
                      borderRadius: '8px', // Bordes más redondeados
                      borderColor: checks[codigo] ? '#3b82f6' : '#e5e7eb',
                      backgroundColor: checks[codigo] ? '#eff6ff' : habilitada ? 'white' : '#f3f4f6',
                      opacity: habilitada ? 1 : 0.6, // Mejor contraste para deshabilitados
                      cursor: habilitada ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease', // Transición suave
                      boxShadow: checks[codigo] ? '0 2px 8px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                    onClick={() => habilitada && setChecks(prev => ({ ...prev, [codigo]: !prev[codigo] }))}
                  >
                    <input
                      type="checkbox"
                      checked={checks[codigo]}
                      disabled={!habilitada}
                      onChange={() => {}}
                      style={{ 
                        marginRight: '12px', // Más separación
                        marginTop: '2px', // Alineación vertical
                        width: '18px', // Checkbox más grande
                        height: '18px',
                        cursor: habilitada ? 'pointer' : 'not-allowed'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: '600', // Más peso para el título
                        fontSize: '16px', // Fuente más grande
                        color: '#111827', // Color más oscuro para mejor contraste
                        lineHeight: '1.4',
                        marginBottom: '6px' // Separación entre título y descripción
                      }}>
                        {config.nombre}
                      </div>
                      <div style={{ 
                        fontSize: '14px', // Fuente más grande para descripción
                        color: '#374151', // Color más oscuro que #6b7280
                        lineHeight: '1.4',
                        fontWeight: '500' // Peso medio para mejor legibilidad
                      }}>
                        Requiere: {config.requiere.join(', ')}
                        {!habilitada && (
                          <div style={{ 
                            color: '#dc2626', 
                            fontSize: '13px', 
                            fontWeight: '600',
                            marginTop: '4px' 
                          }}>
                            ⚠️ Datos faltantes
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={cerrarModalSeleccion}
                style={{
                  padding: '10px 20px', backgroundColor: '#6b7280', color: 'white',
                  border: 'none', borderRadius: '6px', cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAgregarACola(modalSeleccion)}
                style={{
                  padding: '10px 20px', backgroundColor: '#0b74de', color: 'white',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
                }}
              >
                🚀 Iniciar Proceso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardMejorado;