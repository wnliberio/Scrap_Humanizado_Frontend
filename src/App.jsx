// src/App.jsx - VERSIÓN CON DASHBOARD DE MONITOREO
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import DashboardMonitoreo from './components/DashboardMonitoreo';

// Componente para la navegación
function Navigation() {
  const location = useLocation();
  
  return (
    <nav style={{
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          height: '64px' 
        }}>
          
          {/* Logo/Título */}
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              ⚖️ Sistema de Consultas - Función Judicial
            </h1>
          </div>
          
          {/* Info de versión */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              backgroundColor: '#10b981',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              v3.0 - Automático
            </div>
            
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '12px'
            }}>
              FJ
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Página 404
function Pagina404() {
  return (
    <div style={{ 
      minHeight: '70vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div style={{ fontSize: '72px' }}>🔍</div>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
        Página No Encontrada
      </h1>
      <p style={{ color: '#6b7280', fontSize: '16px' }}>
        La página que buscas no existe.
      </p>
      <Link 
        to="/" 
        style={{
          padding: '12px 24px',
          backgroundColor: '#3b82f6',
          color: 'white',
          borderRadius: '6px',
          textDecoration: 'none',
          fontWeight: '600'
        }}
      >
        🏠 Ir al Dashboard
      </Link>
    </div>
  );
}

// Componente principal
function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
        
        {/* Navegación */}
        <Navigation />

        {/* Contenido principal */}
        <div style={{ flex: 1 }}>
          <Routes>
            {/* Ruta principal - Dashboard de Monitoreo */}
            <Route path="/" element={<DashboardMonitoreo />} />
            
            {/* Página 404 */}
            <Route path="*" element={<Pagina404 />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer style={{
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          padding: '16px 0'
        }}>
          <div style={{ 
            maxWidth: '1400px', 
            margin: '0 auto', 
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              © 2025 Sistema de Consultas Automatizadas - Versión 3.0
            </p>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              <span>React + FastAPI</span>
              <span>•</span>
              <span>Procesamiento Automático</span>
              <span>•</span>
              <span>Función Judicial</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;