// src/components/DashboardMejorado.jsx - DASHBOARD CON TRACKING GRANULAR
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
  
  // Estados para modales (igual que Dashboard Original)
  const [modal, setModal] = useState(null); // {type, row, jobId, errorMsg, report}
  
  // Estados para selección de páginas (igual que Dashboard Original)
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
      // Usar el sistema de tracking completo
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
      // Fallback a lista hardcodeada
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

  // Abrir detalles (igual que Dashboard Original) 
  const openDetalles = (row) => {
    // reset checks para que el user decida
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

    if (row.estado === "Pendiente") {
      setModal({ type: "select", row });
    } else if (row.estado === "Procesando") {
      setModal({ type: "processing", row });
    } else if (row.estado === "Procesado") {
      setModal({ type: "summary", row, report: null });
    } else {
      setModal({ type: "error", row, errorMsg: row.mensaje_error || "Error en el procesamiento" });
    }
  };

  // Construir items para el proceso (igual que Dashboard Original)
  const buildItemsForRow = (row) => {
    const items = [];
    const nombre = (row.nombre || "").trim();
    const apellido = (row.apellido || "").trim();
    const fullName = [nombre, apellido].filter(Boolean).join(" ").trim();

    // INTERPOL -> SOLO APELLIDO
    if (checks.interpol) {
      if (!apellido) {
        console.warn("INTERPOL omitido: falta apellido.");
      } else {
        items.push({
          tipo: "interpol",
          valor: apellido,
          apellidos: apellido,
        });
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

    // SRI – RUC -> RUC (13)
    if (checks.ruc) {
      if (!/^\d{13}$/.test(row.ruc || "")) {
        console.warn("RUC omitido: RUC inválido o ausente.");
      } else {
        items.push({ tipo: "ruc", valor: row.ruc });
      }
    }

    // Google
    if (checks.google) {
      if (!fullName) {
        console.warn("Google omitido: falta nombre completo.");
      } else {
        items.push({ tipo: "google", valor: fullName });
      }
    }

    // Contraloría
    if (checks.contraloria) {
      if (!/^\d{10}$/.test(row.ci || "")) {
        console.warn("Contraloría omitido: CI inválida o ausente.");
      } else {
        items.push({ tipo: "contraloria", valor: row.ci });
      }
    }

    // Mercado de Valores
    if (checks.mercado_valores) {
      if (!/^\d{13}$/.test(row.ruc || "")) {
        console.warn("Mercado Valores omitido: RUC inválido o ausente.");
      } else {
        items.push({ tipo: "mercado_valores", valor: row.ruc });
      }
    }

    // Denuncias
    if (checks.denuncias) {
      if (!fullName) {
        console.warn("Denuncias omitido: falta nombre completo.");
      } else {
        items.push({ tipo: "denuncias", valor: fullName });
      }
    }

    // Deudas
    if (checks.deudas) {
      if (!/^\d{13}$/.test(row.ruc || "")) {
        console.warn("Deudas omitido: RUC inválido o ausente.");
      } else {
        items.push({ tipo: "deudas", valor: row.ruc });
      }
    }

    // Predios Quito
    if (checks.predio_quito) {
      if (!/^\d{10}$/.test(row.ci || "")) {
        console.warn("Predio Quito omitido: CI inválida o ausente.");
      } else {
        items.push({ tipo: "predio_quito", valor: row.ci });
      }
    }

    // Predios Manta
    if (checks.predio_manta) {
      if (!/^\d{10}$/.test(row.ci || "")) {
        console.warn("Predio Manta omitido: CI inválida o ausente.");
      } else {
        items.push({ tipo: "predio_manta", valor: row.ci });
      }
    }

    return items;
  };

  // Agregar a cola (ejecutar proceso) - VERSIÓN TRACKING COMPLETA
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
      setModal({ type: "processing", row });

      // Crear proceso usando el sistema de tracking
      const resultado = await crearProcesoConPaginas(
        row.id,
        items.map(item => item.tipo), // Códigos de páginas
        {
          headless: false,
          generateReport: true
        }
      );

      console.log('Proceso de tracking creado:', resultado);
      
      // Mostrar información del proceso creado
      if (resultado.job_id) {
        setModal({ type: "processing", row, jobId: resultado.job_id });
        alert(`Proceso creado exitosamente!
Job ID: ${resultado.job_id}
Proceso ID: ${resultado.proceso_id}
Páginas: ${resultado.paginas_solicitadas.join(', ')}`);
      }

      cargarClientes(); // Refrescar la lista

    } catch (e) {
      console.error("Error completo en tracking:", e);
      await updateClienteEstado(row.id, 'Error', String(e.message || e));
      setModal({ type: "error", row, errorMsg: String(e.message || e) });
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

  // Estilos
  const estilos = {
    container: {
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    header: {
      marginBottom: '24px'
    },
    titulo: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '8px'
    },
    subtitulo: {
      color: '#6b7280',
      fontSize: '14px'
    },
    filtros: {
      display: 'flex',
      gap: '16px',
      marginBottom: '24px',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px'
    },
    input: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      minWidth: '250px'
    },
    button: {
      padding: '8px 16px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    },
    estadisticas: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    },
    tarjetaEstadistica: (color) => ({
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      border: `2px solid ${color}`,
      textAlign: 'center',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }),
    tabla: {
      width: '100%',
      backgroundColor: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    th: {
      backgroundColor: '#f9fafb',
      padding: '12px',
      textAlign: 'left',
      fontWeight: '600',
      color: '#374151',
      borderBottom: '1px solid #e5e7eb'
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #f3f4f6'
    },
    estado: (estado) => {
      const colores = {
        'Pendiente': { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
        'Procesando': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
        'Procesado': { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
        'Error': { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' }
      };
      const color = colores[estado] || colores['Pendiente'];
      return {
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: color.bg,
        color: color.text,
        border: `1px solid ${color.border}`
      };
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '24px',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto'
    },
    paginasGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '12px',
      marginTop: '16px'
    },
    paginaItem: (seleccionada, habilitada) => ({
      display: 'flex',
      alignItems: 'center',
      padding: '12px',
      border: '2px solid',
      borderColor: seleccionada ? '#3b82f6' : '#e5e7eb',
      borderRadius: '6px',
      backgroundColor: seleccionada ? '#eff6ff' : habilitada ? 'white' : '#f9fafb',
      cursor: habilitada ? 'pointer' : 'not-allowed',
      opacity: habilitada ? 1 : 0.5
    })
  };

  return (
    <div style={estilos.container}>
      {/* Header */}
      <div style={estilos.header}>
        <h1 style={estilos.titulo}>Dashboard de Consultas - Mejorado</h1>
        <p style={estilos.subtitulo}>Sistema con tracking granular por página consultada</p>
      </div>

      {/* Filtros */}
      <div style={estilos.filtros}>
        <div>
          <label style={{ marginRight: '8px', fontSize: '14px', fontWeight: '500' }}>
            Filtrar por Estado:
          </label>
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={estilos.select}
          >
            <option value="Todos">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Procesando">Procesando</option>
            <option value="Procesado">Procesado</option>
            <option value="Error">Error</option>
          </select>
        </div>
        
        <div>
          <label style={{ marginRight: '8px', fontSize: '14px', fontWeight: '500' }}>
            Buscar:
          </label>
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, CI, RUC..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={estilos.input}
          />
        </div>
        
        <button 
          onClick={cargarClientes}
          disabled={loading}
          style={{
            ...estilos.button,
            backgroundColor: loading ? '#9ca3af' : '#3b82f6'
          }}
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Estadísticas */}
      <div style={estilos.estadisticas}>
        <div style={estilos.tarjetaEstadistica('#f59e0b')}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#92400e' }}>
            {estadisticas.pendientes}
          </div>
          <div style={{ fontSize: '14px', color: '#92400e' }}>Pendientes</div>
        </div>
        
        <div style={estilos.tarjetaEstadistica('#3b82f6')}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>
            {estadisticas.procesando}
          </div>
          <div style={{ fontSize: '14px', color: '#1e40af' }}>Procesando</div>
        </div>
        
        <div style={estilos.tarjetaEstadistica('#10b981')}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#065f46' }}>
            {estadisticas.procesados}
          </div>
          <div style={{ fontSize: '14px', color: '#065f46' }}>Procesados</div>
        </div>
        
        <div style={estilos.tarjetaEstadistica('#ef4444')}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#991b1b' }}>
            {estadisticas.errores}
          </div>
          <div style={{ fontSize: '14px', color: '#991b1b' }}>Errores</div>
        </div>
      </div>

      {/* Tabla de clientes */}
      <div style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
        Clientes ({clientes.length})
      </div>
      
      <table style={estilos.tabla}>
        <thead>
          <tr>
            <th style={estilos.th}>Cliente</th>
            <th style={estilos.th}>Documentos</th>
            <th style={estilos.th}>Tipo/Monto</th>
            <th style={estilos.th}>Estado</th>
            <th style={estilos.th}>Proceso</th>
            <th style={estilos.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => (
            <tr key={cliente.id}>
              <td style={estilos.td}>
                <div style={{ fontWeight: '600' }}>
                  {cliente.nombre} {cliente.apellido}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  ID: {cliente.id}
                </div>
              </td>
              
              <td style={estilos.td}>
                <div style={{ fontSize: '13px' }}>
                  {cliente.ci && <div>CI: {cliente.ci}</div>}
                  {cliente.ruc && <div>RUC: {cliente.ruc}</div>}
                  {!cliente.ci && !cliente.ruc && <div style={{ color: '#9ca3af' }}>Sin docs</div>}
                </div>
              </td>
              
              <td style={estilos.td}>
                <div style={{ fontSize: '13px' }}>
                  <div>{cliente.tipo || 'N/A'}</div>
                  {cliente.monto && (
                    <div style={{ fontWeight: '600', color: '#059669' }}>
                      ${cliente.monto.toLocaleString()}
                    </div>
                  )}
                </div>
              </td>
              
              <td style={estilos.td}>
                <span style={estilos.estado(cliente.estado)}>
                  {cliente.estado}
                </span>
              </td>
              
              <td style={estilos.td}>
                {cliente.proceso_activo ? (
                  <div style={{ fontSize: '12px' }}>
                    <div style={{ color: '#3b82f6', fontWeight: '500' }}>
                      {cliente.proceso_activo.estado}
                    </div>
                    {cliente.proceso_activo.progreso && (
                      <div style={{ marginTop: '4px' }}>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {cliente.proceso_activo.progreso.completadas}/{cliente.proceso_activo.progreso.total}
                        </div>
                        <div style={{
                          width: '100%',
                          height: '4px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(cliente.proceso_activo.progreso.completadas / cliente.proceso_activo.progreso.total) * 100}%`,
                            height: '100%',
                            backgroundColor: '#3b82f6',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Sin proceso</span>
                )}
              </td>
              
              <td style={estilos.td}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => openDetalles(cliente)}
                    style={{
                      ...estilos.button,
                      fontSize: '12px',
                      padding: '4px 8px',
                      backgroundColor: '#6b7280'
                    }}
                  >
                    Detalles
                  </button>
                  
                  {cliente.estado === 'Pendiente' && (
                    <button
                      onClick={() => openDetalles(cliente)}
                      style={{
                        ...estilos.button,
                        fontSize: '12px',
                        padding: '4px 8px',
                        backgroundColor: '#10b981'
                      }}
                    >
                      Seleccionar Páginas
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          
          {clientes.length === 0 && (
            <tr>
              <td colSpan={6} style={{ ...estilos.td, textAlign: 'center', color: '#9ca3af' }}>
                {loading ? 'Cargando...' : 'No hay clientes'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Error */}
      {error && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '6px',
          border: '1px solid #fecaca'
        }}>
          Error: {error}
        </div>
      )}

      {/* Modales (igual que Dashboard Original) */}
      {modal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 99999, backdropFilter: "blur(2px)"
        }} onClick={() => setModal(null)}>
          <div style={{
            width: 820, maxWidth: "95vw", background: "#fff", borderRadius: 8, 
            overflow: "hidden", boxShadow: "0 14px 40px rgba(0,0,0,.25)"
          }} onClick={e => e.stopPropagation()}>
            
            {/* Header dinámico */}
            <div style={{
              background: "linear-gradient(90deg, #0b74de, #1d4ed8)", color: "#fff", padding: 12, 
              fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <div>
                {modal.type === "select" && "Seleccionar Páginas a Consultar"}
                {modal.type === "processing" && "Flujo en Proceso"}
                {modal.type === "summary" && "Resumen de Consulta"}
                {modal.type === "error" && "Resumen de Consulta"}
              </div>
              <button onClick={() => setModal(null)} style={{ 
                background: "transparent", color: "#fff", border: 0, fontSize: 24, cursor: "pointer" 
              }}>×</button>
            </div>

            {/* Cuerpo */}
            <div style={{ padding: 16 }}>
              {/* Pendiente -> selector */}
              {modal.type === "select" && (
                <>
                  <div style={{ 
                    background: "#f0f9ff", border: "1px solid #b3e5fc", padding: 16, 
                    borderRadius: 8, marginBottom: 20, color: '#0c4a6e', fontSize: '16px', lineHeight: '1.5' 
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '15px' }}>
                      Registro seleccionado:
                    </div>
                    <div>Nombre: {modal.row.apellido} {modal.row.nombre}</div>
                    <div>CI/RUC: {modal.row.ci || "—"}{modal.row.ruc ? ` / ${modal.row.ruc}` : ""}</div>
                  </div>

                  <div style={{ fontWeight: 700, marginBottom: 16, fontSize: '16px', color: '#111827' }}>
                    Selecciona las páginas que deseas consultar:
                  </div>

                  {/* GRID de tarjetas */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {[
                      { key: "interpol", title: "INTERPOL - Notificaciones rojas", require: "Usa: Solo APELLIDO" },
                      { key: "supercias_persona", title: "Superintendencia de Compañías - Personas (Acciones)", require: "Usa: CI (10 dígitos)" },
                      { key: "ruc", title: "SRI - Consulta RUC", require: "Usa: RUC (13 dígitos)" },
                      { key: "google", title: "Google - Búsqueda por nombres", require: "Usa: Nombres + Apellidos" },
                      { key: "contraloria", title: "Contraloría - Declaraciones Patrimoniales", require: "Usa: CI (10 dígitos)" },
                      { key: "mercado_valores", title: "Mercado de Valores (Supercias)", require: "Usa: RUC (13 dígitos)" },
                      { key: "denuncias", title: "Fiscalía - Denuncias/Noticias de delito", require: "Usa: Nombres + Apellidos" },
                      { key: "deudas", title: "SRI - Deudas Firmes/Impugnadas/Facturas", require: "Usa: RUC (13 dígitos)" },
                      { key: "predio_quito", title: "Predios - Municipio de Quito", require: "Usa: CI (10 dígitos)" },
                      { key: "predio_manta", title: "Predios - Municipio de Manta", require: "Usa: CI (10 dígitos)" },
                    ].map(({ key, title, require }) => (
                      <div
                        key={key}
                        style={{
                          border: checks[key] ? "2px solid #10b981" : "1px solid #e5e7eb",
                          borderRadius: 8, padding: 12, background: checks[key] ? "#ecfdf5" : "#fff",
                          cursor: "pointer", transition: "all 0.2s",
                        }}
                        onClick={() => setChecks(prev => ({ ...prev, [key]: !prev[key] }))}
                      >
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                          <input
                            type="checkbox"
                            checked={checks[key]}
                            onChange={() => {}}
                            style={{ marginRight: 8 }}
                          />
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{title}</div>
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{require}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Procesando */}
              {modal.type === "processing" && (
                <div style={{ 
                  background: '#eff6ff', border: '2px solid #3b82f6', padding: '16px', 
                  borderRadius: '8px', color: '#1e40af', fontSize: '14px', lineHeight: '1.5', textAlign: 'center' 
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>🔄</div>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>
                    Flujo en proceso
                  </div>
                  <div style={{ color: '#4b5563', fontSize: '16px' }}>
                    Por favor espere...
                  </div>
                  {modal.jobId && (
                    <div style={{ marginTop: 12, color: '#6b7280', fontSize: '14px' }}>
                      Job: {modal.jobId}
                    </div>
                  )}
                </div>
              )}

              {/* Resumen – OK */}
              {modal.type === "summary" && (
                <div style={{ 
                  background: '#f0fdf4', border: '2px solid #22c55e', padding: '16px', 
                  borderRadius: '8px', marginBottom: '20px', color: '#14532d', fontSize: '14px', lineHeight: '1.5' 
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '15px' }}>
                    Procesamiento completado exitosamente
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <strong>Procesado:</strong> {new Date().toLocaleString("es-EC")}
                  </div>
                  <div>
                    <strong>Registro:</strong> {modal.row.apellido} {modal.row.nombre} - {modal.row.ci || "—"}
                  </div>
                </div>
              )}

              {/* Resumen – Error */}
              {modal.type === "error" && (
                <div style={{ 
                  background: '#fef2f2', border: '2px solid #ef4444', padding: '16px', 
                  borderRadius: '8px', color: '#7f1d1d', fontSize: '14px', lineHeight: '1.5' 
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 12, fontSize: '15px' }}>
                    ⚠️ Error en el procesamiento
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Mensaje:</strong> {modal.errorMsg || "Error desconocido"}
                  </div>
                  <div>
                    <strong>Fecha del error:</strong> {new Date().toLocaleString("es-EC")}
                  </div>
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div style={{ padding: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              {modal.type === "select" && (
                <>
                  <button
                    onClick={() => setModal(null)}
                    style={{ padding: "10px 14px", background: "#6b7280", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleAgregarACola(modal.row)}
                    style={{ padding: "10px 14px", background: "#0b74de", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
                  >
                    + Agregar a Cola
                  </button>
                </>
              )}
              {modal.type !== "select" && (
                <button
                  onClick={() => setModal(null)}
                  style={{ padding: "10px 14px", background: "#6b7280", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardMejorado;