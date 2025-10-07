import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import authService from './authService';

// Este componente envuelve las rutas que requieren autenticación
const ProtectedRoute = ({ component: Component }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      // Usamos el servicio para verificar si hay una sesión válida
      const authStatus = await authService.verifyToken();
      setIsAuthenticated(authStatus);
    };
    checkAuth();
  }, []);

  // Mientras se verifica, no mostramos nada o un loader
  if (isAuthenticated === null) {
    return <div>Verificando sesión...</div>; 
  }

  // Si está autenticado, muestra el componente. Si no, redirige al login.
  return isAuthenticated ? <Component /> : <Navigate to="/admin" replace />;
};

export default ProtectedRoute;