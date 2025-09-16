// src/App.jsx - ACTUALIZADO CON REACT ROUTER
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

// Componentes existentes
import Dashboard from './pages/Dashboard';
import QueryForm from './components/QueryForm';

// Nuevos componentes (los crearemos después)
import DashboardMejorado from './components/DashboardMejorado';

// Componente para la navegación con estado activo
function Navigation() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const linkClass = (path, isSpecial = false) => {
    const baseClass = "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors";
    if (isActive(path)) {
      return `${baseClass} ${isSpecial ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500' : 'bg-gray-100 text-gray-900 border-b-2 border-gray-500'}`;
    }
    return `${baseClass} text-gray-600 hover:text-gray-900 hover:bg-gray-50`;
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">
                📊 Sistema de Consultas
              </h1>
            </div>
            
            <div className="flex space-x-4">
              <Link to="/" className={linkClass('/')}>
                🏠 Dashboard Original
              </Link>
              <Link to="/mejorado" className={linkClass('/mejorado', true)}>
                🚀 Dashboard Mejorado
              </Link>
              <Link to="/consultas" className={linkClass('/consultas')}>
                🔍 Consultas Directas
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              v2.0 - Tracking Granular
            </span>
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">SQ</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        {/* Contenido principal */}
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Routes>
            {/* Dashboard original */}
            <Route path="/" element={
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Dashboard Original</h2>
                  <p className="text-gray-600">Sistema tradicional de consultas automatizadas</p>
                </div>
                <Dashboard />
              </div>
            } />
            
            {/* Nuevo dashboard mejorado */}
            <Route path="/mejorado" element={
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    🚀 Dashboard Mejorado
                  </h2>
                  <p className="text-gray-600">
                    Nueva versión con tracking granular y mejores visualizaciones
                  </p>
                </div>
                <DashboardMejorado />
              </div>
            } />
            
            {/* Consultas directas */}
            <Route path="/consultas" element={
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Consultas Directas</h2>
                  <p className="text-gray-600">Realizar consultas individuales en tiempo real</p>
                </div>
                <QueryForm />
              </div>
            } />
            
            {/* Página de inicio/bienvenida */}
            <Route path="/welcome" element={
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-6">🎯</div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Sistema de Consultas Automatizadas
                  </h1>
                  <p className="text-gray-600 mb-8 text-lg">
                    Ahora con tracking granular por página consultada y mejores visualizaciones
                  </p>
                  
                  <div className="space-y-4">
                    <Link 
                      to="/" 
                      className="block w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      📊 Dashboard Original
                    </Link>
                    <Link 
                      to="/mejorado" 
                      className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      🚀 Dashboard Mejorado (Nuevo)
                    </Link>
                    <Link 
                      to="/consultas" 
                      className="block w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      🔍 Consultas Directas
                    </Link>
                  </div>
                </div>
              </div>
            } />
            
            {/* Ruta por defecto - redirige al dashboard original */}
            <Route path="*" element={
              <div className="text-center py-12">
                <div className="text-6xl mb-6">❓</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Página no encontrada
                </h1>
                <p className="text-gray-600 mb-8">
                  La página que buscas no existe.
                </p>
                <div className="space-x-4">
                  <Link 
                    to="/" 
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ir al Dashboard
                  </Link>
                  <Link 
                    to="/welcome" 
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Página de Inicio
                  </Link>
                </div>
              </div>
            } />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t mt-auto">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                © 2025 Sistema de Consultas - Versión 2.0
              </p>
              <p className="text-sm text-gray-400">
                Desarrollado con React + FastAPI
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;