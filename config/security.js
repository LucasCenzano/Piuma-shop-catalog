// En el archivo: config/security.js

const securityConfig = {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Cache-Control'
    ],
    credentials: true
  },

  // 👇 AÑADE ESTE BLOQUE COMPLETO
  rateLimit: {
    // Configuración para el límite general de la API
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // Límite de 100 peticiones por IP cada 15 minutos
      standardHeaders: true,
      legacyHeaders: false,
    },
    // Configuración específica para el login
    login: {
      windowMs: 10 * 60 * 1000, // 10 minutos
      max: 5, // Límite de 5 intentos de login por IP cada 10 minutos
      message: 'Demasiados intentos de inicio de sesión. Por favor, inténtalo de nuevo más tarde.'
    }
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'tu_secreto_por_defecto',
    expiresIn: '1h',
    refreshExpiresIn: '7d'
  },

  bcrypt: {
    rounds: 12
  }
};

module.exports = securityConfig;