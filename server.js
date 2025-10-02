// server.js - Servidor de desarrollo para las APIs
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Función para adaptar handlers de Vercel a Express
const adaptHandler = (handler) => {
  return async (req, res) => {
    try {
      // Crear objeto res compatible con handlers de Vercel
      const vercelRes = {
        status: (code) => ({
          json: (data) => res.status(code).json(data),
          end: (data) => res.status(code).end(data),
          send: (data) => res.status(code).send(data)
        }),
        json: (data) => res.json(data),
        end: (data) => res.end(data),
        setHeader: (name, value) => res.setHeader(name, value)
      };

      await handler(req, vercelRes);
    } catch (error) {
      console.error('Error en API:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor', 
        details: error.message 
      });
    }
  };
};

// Importar handlers
const authHandler = require('./api/auth');
const productsHandler = require('./api/products');
const adminProductsHandler = require('./api/admin/products');
const customersHandler = require('./api/customers');
const testDbHandler = require('./test-db');
const testAuthHandler = require('./api/test-auth');

// Configurar rutas
app.post('/api/auth', adaptHandler(authHandler));
app.get('/api/products', adaptHandler(productsHandler));
app.put('/api/products', adaptHandler(productsHandler));
app.all('/api/admin/products', adaptHandler(adminProductsHandler));
app.all('/api/customers', adaptHandler(customersHandler));
app.get('/api/test-db', adaptHandler(testDbHandler));
app.get('/api/test-auth', adaptHandler(testAuthHandler));

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando',
    database_configured: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor API ejecutándose en http://localhost:${PORT}`);
  console.log(`📦 Base de datos configurada: ${!!(process.env.DATABASE_URL || process.env.POSTGRES_URL) ? 'SÍ' : 'NO'}`);
  console.log(`🔍 Prueba la API: http://localhost:${PORT}/api/health`);
  
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    console.log(`✅ Ready para conectar con la base de datos`);
  } else {
    console.log(`❌ FALTA: Crear archivo .env.local con DATABASE_URL`);
  }
});