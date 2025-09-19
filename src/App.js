// src/App.js - Aplicación principal con routing actualizado para ventas
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainApp from './MainApp'; // Catálogo principal
import AdminApp from './AdminApp'; // Panel de administración principal
import AdminVentas from './AdminVentas'; // Panel de ventas independiente
import './styles.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal del catálogo */}
        <Route path="/" element={<MainApp />} />
        
        {/* Ruta principal de administración */}
        <Route path="/admin" element={<AdminApp />} />
        
        {/* Ruta específica para el módulo de ventas */}
        <Route path="/admin/ventas" element={<AdminVentas />} />
        
        {/* Redireccionar rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;