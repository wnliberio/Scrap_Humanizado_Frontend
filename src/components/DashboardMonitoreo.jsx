// src/components/DashboardMonitoreo.jsx - CON CONTADORES DE ESTADÍSTICAS
import React, { useState, useEffect, useMemo } from 'react';
import ModalDetallesMejorado from './ModalDetallesMejorado';

const DashboardMonitoreo = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Estado del daemon
  const [daemonState, setDaemonState] = useState({
    running: false,
    loading: false
  });

  const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

  // ===== CALCULAR ESTADÍSTICAS =====
  const estadisticas = useMemo(() => {
    const total = clientes.length;
    const pendientes = clientes.filter(c => c.estado === 'Pendiente').length;
    const procesando = clientes.filter(c => c.estado === 'Procesando').length;
    const procesados = clientes.filter(c => c.estado === 'Procesado').length;
    const errores = clientes.filter(c => c.estado === 'Error').length;
    
    return { total, pendientes, procesando, procesados, errores };
  }, [clientes]);

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
        alert('⏹️ Daemon detenido correctamente');
        setDaemonState({ running: false, loading: false });
      }
    } catch (error) {
      alert(`❌ Error deteniendo daemon: ${error.message}`);
      setDaemonState(prev => ({ ...prev, loading: false }));
    }
  };

  // ===== FUNCIONES DE CLIENTES =====
  
  const cargarClientes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filtroEstado !== 'Todos') {
        params.set('estado', filtroEstado);
      }
      if (busqueda.trim()) {
        params.set('q', busqueda.trim());
      }
      
      const url = `${BASE}/tracking/clientes${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();
        setClientes(data);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirDetalles = (cliente) => {
    setClienteSeleccionado(cliente);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setClienteSeleccionado(null);
    cargarClientes(); // Refrescar después de cerrar
  };

  // ===== EFECTOS =====
  
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

  // ===== HELPERS =====
  
  const getEstadoColor = (estado) => {
    const colores = {
      'Pendiente': '#f59e0b',
      'Procesando': '#3b82f6',
      'Procesado': '#10b981',
      'Error': '#ef4444'
    };
    return colores[estado] || '#6b7280';
  };

  const getEstadoIcono = (estado) => {
    const iconos = {
      'Pendiente': '⏳',
      'Procesando': '🔄',
      'Procesado': '✅',
      'Error': '❌'
    };
    return iconos[estado] || '❓';
  };

  // ===== RENDER =====
  
  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
          Dashboard de Monitoreo
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Vista en tiempo real del procesamiento automático
        </p>
      </div>

      {/* CONTADORES DE ESTADÍSTICAS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        {/* Total */}
        <div style={{
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          border: '2px solid #6b7280', 
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#374151' }}>
            {estadisticas.total}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
            TOTAL
          </div>
        </div>

        {/* Pendientes */}
        <div style={{
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          border: '2px solid #f59e0b', 
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#92400e' }}>
            {estadisticas.pendientes}
          </div>
          <div style={{ fontSize: '14px', color: '#92400e', fontWeight: '500' }}>
            PENDIENTES
          </div>
        </div>
        
        {/* Procesando */}
        <div style={{
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          border: '2px solid #3b82f6', 
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e40af' }}>
            {estadisticas.procesando}
          </div>
          <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: '500' }}>
            PROCESANDO
          </div>
        </div>
        
        {/* Procesados */}
        <div style={{
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          border: '2px solid #10b981', 
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#065f46' }}>
            {estadisticas.procesados}
          </div>
          <div style={{ fontSize: '14px', color: '#065f46', fontWeight: '500' }}>
            PROCESADOS
          </div>
        </div>
        
        {/* Errores */}
        <div style={{
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          border: '2px solid #ef4444', 
          textAlign: 'center',
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

      {/* Control del Daemon + Filtros */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="Todos">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Procesando">Procesando</option>
            <option value="Procesado">Procesado</option>
            <option value="Error">Error</option>
          </select>
          
          <input
            type="text"
            placeholder="Nombre, apellido, CI, RUC..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '250px'
            }}
          />
          
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
              opacity: loading ? 0.6 : 1,
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {loading ? '🔄 Cargando...' : '🔄 Refrescar'}
          </button>
        </div>

        {/* Estado del Daemon */}
        <div style={{
          backgroundColor: daemonState.running ? '#dcfce7' : '#fee2e2',
          border: `2px solid ${daemonState.running ? '#10b981' : '#ef4444'}`,
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#6b7280',
              marginBottom: '4px'
            }}>
              Estado del Daemon
            </div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: daemonState.running ? '#065f46' : '#991b1b'
            }}>
              {daemonState.running ? '● EJECUTANDO' : '● DETENIDO'}
            </div>
          </div>
          
          <button
            onClick={daemonState.running ? detenerDaemon : iniciarDaemon}
            disabled={daemonState.loading}
            style={{
              padding: '8px 16px',
              backgroundColor: daemonState.running ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: daemonState.loading ? 'not-allowed' : 'pointer',
              opacity: daemonState.loading ? 0.6 : 1,
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {daemonState.loading ? '⏳...' : (daemonState.running ? '⏹ Detener' : '▶ Iniciar')}
          </button>
        </div>
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
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Cliente</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>CI/RUC</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Estado</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Fecha</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                  {loading ? '🔄 Cargando clientes...' : '📭 No hay clientes con estos filtros'}
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr 
                  key={cliente.id}
                  style={{ 
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <td style={{ padding: '12px', fontSize: '14px', color: '#374151' }}>
                    {cliente.id}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                    {cliente.nombre} {cliente.apellido}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                    <div>{cliente.ci && `CI: ${cliente.ci}`}</div>
                    <div>{cliente.ruc && `RUC: ${cliente.ruc}`}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: `${getEstadoColor(cliente.estado)}20`,
                      color: getEstadoColor(cliente.estado)
                    }}>
                      {getEstadoIcono(cliente.estado)} {cliente.estado}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                    {new Date(cliente.fecha_creacion).toLocaleString('es-EC', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => abrirDetalles(cliente)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}
                    >
                      📋 Ver Detalles
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info del Daemon */}
      {daemonState.running && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#dbeafe',
          border: '1px solid #3b82f6',
          borderRadius: '8px'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#1e40af' }}>
            ℹ️ <strong>Daemon en ejecución:</strong> El sistema procesará automáticamente los clientes pendientes.
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