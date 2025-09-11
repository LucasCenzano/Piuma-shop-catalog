// server-simple.js - Servidor simple para desarrollo
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = 3001;

// Configuración de base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Función helper para queries
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Ruta de salud
app.get('/api/health', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as current_time');
    res.json({ 
      status: 'OK', 
      message: 'Servidor y DB funcionando',
      database_time: result.rows[0].current_time,
      database_configured: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL)
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Error conectando a la base de datos',
      error: error.message 
    });
  }
});

// API de productos públicos (GET)
app.get('/api/products', async (req, res) => {
  try {
    console.log('📦 Obteniendo productos...');
    
    if (req.query.id) {
      // Obtener un producto específico
      const result = await query(
        'SELECT * FROM products WHERE id = $1',
        [parseInt(req.query.id)]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      
      const product = result.rows[0];
      
      // Parsear images_url si es string
      if (typeof product.images_url === 'string') {
        try {
          product.images_url = JSON.parse(product.images_url);
        } catch (e) {
          product.images_url = [];
        }
      }
      
      return res.json(product);
    } else {
      // Obtener todos los productos
      const result = await query(`
        SELECT 
          id,
          name,
          price,
          category,
          description,
          in_stock,
          images_url,
          created_at,
          updated_at
        FROM products 
        ORDER BY category, name
      `);
      
      const products = result.rows.map(product => {
        // Parsear images_url si es string
        if (typeof product.images_url === 'string') {
          try {
            product.images_url = JSON.parse(product.images_url);
          } catch (e) {
            product.images_url = [];
          }
        }
        return product;
      });
      
      console.log(`✅ Enviando ${products.length} productos`);
      return res.json(products);
    }
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// API de productos públicos (PUT) - Actualizar stock
app.put('/api/products', async (req, res) => {
  try {
    const { id, inStock } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'ID del producto es requerido' });
    }

    if (typeof inStock !== 'boolean') {
      return res.status(400).json({ error: 'El campo inStock debe ser un booleano' });
    }

    const updateResult = await query(
      'UPDATE products SET in_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [inStock, parseInt(id)]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const updatedProduct = updateResult.rows[0];
    
    // Parsear images_url si es string
    if (typeof updatedProduct.images_url === 'string') {
      try {
        updatedProduct.images_url = JSON.parse(updatedProduct.images_url);
      } catch (e) {
        updatedProduct.images_url = [];
      }
    }

    return res.json({
      message: 'Stock actualizado exitosamente',
      product: updatedProduct
    });
  } catch (error) {
    console.error('❌ Error actualizando stock:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    details: error.message 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor API ejecutándose en http://localhost:${PORT}`);
  console.log(`📦 Base de datos configurada: ${!!(process.env.DATABASE_URL || process.env.POSTGRES_URL) ? 'SÍ' : 'NO'}`);
  console.log(`🔍 Endpoints disponibles:`);
  console.log(`   - GET  http://localhost:${PORT}/api/health`);
  console.log(`   - GET  http://localhost:${PORT}/api/products`);
  console.log(`   - PUT  http://localhost:${PORT}/api/products`);
  console.log(`\n💡 Prueba: http://localhost:${PORT}/api/products`);
});