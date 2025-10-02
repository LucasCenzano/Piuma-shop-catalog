// auth-middleware.js - Middleware de autenticación básico
const authService = require('./authService'); // Ajusta la ruta según tu estructura

function auth(handler) {
  return async (req, res) => {
    try {
      // Verificar si el usuario está autenticado
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No autorizado - Token faltante' });
      }

      // Verificar el token usando tu servicio de autenticación
      const user = await authService.verifyToken(token);
      if (!user) {
        return res.status(401).json({ error: 'No autorizado - Token inválido' });
      }

      // Agregar el usuario a la request para que esté disponible en el handler
      req.user = user;
      
      // Continuar con el handler original
      return handler(req, res);
    } catch (error) {
      console.error('Error en middleware de autenticación:', error);
      return res.status(401).json({ error: 'No autorizado' });
    }
  };
}

module.exports = auth;