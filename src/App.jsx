// src/App.jsx - VERSIÓN LIMPIA SIN RUTAS NO DESEADAS
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

// Solo los componentes que queremos mantener
import DashboardMejorado from './components/DashboardMejorado';

// Componente para la navegación simplificada
function Navigation() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const linkClass = (path) => {
    const baseClass = "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors";
    if (isActive(path)) {
      return `${baseClass} bg-blue-100 text-blue-700 border-b-2 border-blue-500`;
    }
    return `${baseClass} text-gray-600 hover:text-gray-900 hover:bg-gray-50`;
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo/Título */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="ml-2">QueriBot</span>
              </h1>
            </div>
          </div>
          
          {/* Navegación central - Solo Dashboard Mejorado */}
          <div className="flex items-center">
            <Link to="/" className={linkClass('/')}>
              📊 Dashboard Principal
            </Link>
          </div>
          
          {/* Info de versión */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500 flex items-center">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium mr-2">
                v2.0
              </span>
              Tracking Granular Activo
            </div>
            
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">SQ</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Página de bienvenida simplificada (solo si alguien accede a /welcome)
function PaginaBienvenida() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="text-8xl mb-8">🚀</div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Sistema de Consultas 2.0
        </h1>
        
        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          Tracking granular por página consultada, reportes automáticos en formato DOCX, 
          y seguimiento en tiempo real de todos los procesos.
        </p>
        
        <div className="space-y-4">
          <Link 
            to="/" 
            className="block w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            🚀 Ir al Dashboard Principal
          </Link>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-8">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="font-semibold text-green-800 mb-2">✅ Implementado</div>
              <ul className="space-y-1 text-left">
                <li>• Tracking granular</li>
                <li>• Reportes DOCX</li>
                <li>• Dashboard en tiempo real</li>
                <li>• Múltiples páginas web</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="font-semibold text-blue-800 mb-2">🎯 Características</div>
              <ul className="space-y-1 text-left">
                <li>• Estados detallados</li>
                <li>• Descarga automática</li>
                <li>• Polling cada 5 seg</li>
                <li>• Interfaz moderna</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Página 404 personalizada
function Pagina404() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-6">❓</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Página no encontrada
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          La página que buscas no existe o ha sido removida.
        </p>
        <div className="space-x-4">
          <Link 
            to="/" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            🏠 Ir al Dashboard
          </Link>
          <Link 
            to="/welcome" 
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            ℹ️ Información
          </Link>
        </div>
      </div>
    </div>
  );
}

// Componente principal de la App
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        
        {/* Navegación */}
        <Navigation />

        {/* Contenido principal */}
        <div className="flex-1">
          <Routes>
            {/* Ruta principal - Dashboard Mejorado */}
            <Route path="/" element={<DashboardMejorado />} />
            
            {/* Página de información/bienvenida */}
            <Route path="/welcome" element={<PaginaBienvenida />} />
            
            {/* Página 404 para cualquier ruta no encontrada */}
            <Route path="*" element={<Pagina404 />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                © 2025 Sistema de Consultas Automatizadas - Versión 2.0
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Desarrollado con React + FastAPI</span>
                <span>•</span>
                <span>Tracking Granular Habilitado</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;