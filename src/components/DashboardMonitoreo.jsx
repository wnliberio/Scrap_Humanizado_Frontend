// src/components/DashboardMonitoreo.jsx - VISTA SOLO LECTURA CON CONTROL DE DAEMON
import React, { useState, useEffect } from 'react';
import ModalDetallesMejorado from './ModalDetallesMejorado';

const DashboardMonitoreo = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // NUEVO: Estado del daemon
  const [daemonState, setDaemonState] = useState({
    running: false,
    loading: false
  });

  const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

  // ===== FUNCIONES DE DAEMON =====
  
  const obtenerEstadoDaemon = async () => {
    try {
      const res = await fetch(`${BASE}/daemon/estado`);
      if (res.ok) {
        const data = await res.json();
        setDaemonState(prev => ({ ...prev, running: data.running }));
      }
    } catch (error) {
      console.error('Error obteniendo estado daemon:', error);
    }
  };

  const iniciarDaemon = async () => {
    if (daemonState.loading) return;
    
    try {
      setDaemonState(prev => ({ ...prev, loading: true }));
      const res = await fetch(`${BASE}/daemon/iniciar`, { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        alert('✅ Daemon iniciado correctamente\nEl sistema procesará automáticamente clientes pendientes.');
        setDaemonState({ running: true, loading: false });
      } else {
        alert(`⚠️ ${data.message}`);
        setDaemonState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      alert(`❌ Error iniciando daemon: ${error.message}`);
      setDaemonState(prev => ({ ...prev, loading: false }));
    }
  };

  const detenerDaemon = async () => {
    if (daemonState.loading) return;
    
    if (!confirm('¿Detener el procesamiento automático?\n\nEl daemon terminará el cliente actual y se detendrá.')) {
      return;
    }
    
    try {
      setDaemonState(prev => ({ ...prev, loading: true }));
      const res = await fetch(`${BASE}/daemon/detener`, { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        alert('✅ Daemon detenido correctamente');
        setDaemonState({ running: false, loading: false });
      } else {
        alert(`⚠️ ${data.message}`);
        setDaemonState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      alert(`❌ Error deteniendo daemon: ${error.message}`);
      setDaemonState(prev => ({ ...prev, loading: false }));
    }
  };

  // ===== CARGAR CLIENTES =====
  
  const cargarClientes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado && filtroEstado !== 'Todos') params.append('estado', filtroEstado);
      if (busqueda.trim()) params.append('q', busqueda.trim());
      
      const url = `${BASE}/tracking/clientes?${params.toString()}`;
      const res = await fetch(url);
      
      if (!res.ok) throw new Error(`Error ${res.status}`);
      
      const data = await res.json();
      setClientes(data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      alert('Error cargando clientes');
    } finally {
      setLoading(false);
    }
  };

  // ===== POLLING =====
  
  useEffect(() => {
    cargarClientes();
    obtenerEstadoDaemon();
    
    // Polling cada 5 segundos
    const interval = setInterval(() => {
      cargarClientes();
      obtenerEstadoDaemon();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [filtroEstado, busqueda]);

  // ===== FUNCIONES DE UI =====
  
  const verDetalles = (cliente) => {
    setClienteSeleccionado(cliente);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setClienteSeleccionado(null);
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Procesando': 'bg-blue-100 text-blue-800',
      'Procesado': 'bg-green-100 text-green-800',
      'Error': 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ===== RENDER =====
  
  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header con Control del Daemon */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
              Dashboard de Monitoreo
            </h1>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              Vista en tiempo real del procesamiento automático
            </p>
          </div>
          
          {/* Controles del Daemon */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'center',
            padding: '16px',
            backgroundColor: daemonState.running ? '#d1fae5' : '#fee2e2',
            borderRadius: '8px',
            border: `2px solid ${daemonState.running ? '#10b981' : '#ef4444'}`
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>
                Estado del Daemon
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: daemonState.running ? '#059669' : '#dc2626',
                fontWeight: '600'
              }}>
                {daemonState.running ? '🟢 EJECUTÁNDOSE' : '🔴 DETENIDO'}
              </div>
            </div>
            
            {daemonState.running ? (
              <button
                onClick={detenerDaemon}
                disabled={daemonState.loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: daemonState.loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  opacity: daemonState.loading ? 0.6 : 1
                }}
              >
                {daemonState.loading ? '⏳ Deteniendo...' : '⏹️ Detener'}
              </button>
            ) : (
              <button
                onClick={iniciarDaemon}
                disabled={daemonState.loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: daemonState.loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  opacity: daemonState.loading ? 0.6 : 1
                }}
              >
                {daemonState.loading ? '⏳ Iniciando...' : '▶️ Iniciar'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        alignItems: 'center',
        flexWrap: 'wrap',
        backgroundColor: '#f3f4f6',
        padding: '16px',
        borderRadius: '8px'
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
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              minWidth: '300px'
            }}
          />
        </div>

        <button
          onClick={cargarClientes}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '🔄 Cargando...' : '🔄 Refrescar'}
        </button>
      </div>

      {/* Tabla de Clientes */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Cliente</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>CI/RUC</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Estado</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Fecha</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                  {loading ? '🔄 Cargando...' : '📭 No hay clientes con estos filtros'}
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr
                  key={cliente.id}
                  style={{ borderBottom: '1px solid #e5e7eb' }}
                >
                  <td style={{ padding: '12px' }}>{cliente.id}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: '500' }}>
                      {cliente.apellido} {cliente.nombre}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                    {cliente.ci || cliente.ruc || 'N/A'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }} className={getEstadoColor(cliente.estado)}>
                      {cliente.estado}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                    {formatearFecha(cliente.fecha_creacion)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => verDetalles(cliente)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      👁️ Ver Detalles
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Información del Daemon */}
      {daemonState.running && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#dbeafe',
          borderRadius: '8px',
          border: '1px solid #3b82f6'
        }}>
          <p style={{ margin: 0, color: '#1e40af', fontSize: '14px' }}>
            ℹ️ <strong>Daemon activo:</strong> El sistema está procesando automáticamente clientes pendientes. 
            Procesa hasta 5 clientes y espera 30 minutos entre lotes.
          </p>
        </div>
      )}

      {/* Modal de Detalles */}
      {modalVisible && clienteSeleccionado && (
        <ModalDetallesMejorado
          cliente={clienteSeleccionado}
          isVisible={modalVisible}
          onClose={cerrarModal}
        />
      )}
    </div>
  );
};

export default DashboardMonitoreo;