// src/App.js - Aplicación principal con routing
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainApp from './MainApp'; // Tu aplicación actual del catálogo
import AdminApp from './AdminApp'; // Nueva aplicación de administración
import './styles.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal del catálogo */}
        <Route path="/" element={<MainApp />} />
        
        {/* Ruta de administración */}
        <Route path="/admin" element={<AdminApp />} />
        
        {/* Redireccionar rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;