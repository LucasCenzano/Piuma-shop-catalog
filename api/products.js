// /api/products.js - API Route para Vercel con Neon PostgreSQL
import { Pool } from 'pg';

// Configuración de la conexión a Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Función helper para ejecutar queries
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        // Obtener productos
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
          // Convertir images_url de JSON string a array si es necesario
          if (typeof product.images_url === 'string') {
            product.images_url = JSON.parse(product.images_url);
          }
          
          return res.status(200).json(product);
        } else {
          // Obtener todos los productos
          const result = await query('SELECT * FROM products ORDER BY id');
          const products = result.rows.map(product => {
            // Convertir images_url de JSON string a array si es necesario
            if (typeof product.images_url === 'string') {
              product.images_url = JSON.parse(product.images_url);
            }
            return product;
          });
          
          return res.status(200).json(products);
        }

      case 'POST':
        // Crear o actualizar productos en lote
        const { products } = req.body;
        
        if (!products || !Array.isArray(products)) {
          return res.status(400).json({ error: 'Se requiere un array de productos' });
        }

        // Crear tabla si no existe
        await query(`
          CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price VARCHAR(50),
            category VARCHAR(100) NOT NULL,
            in_stock BOOLEAN DEFAULT true,
            images_url JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Insertar o actualizar productos
        for (const product of products) {
          await query(`
            INSERT INTO products (id, name, price, category, in_stock, images_url, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            ON CONFLICT (id) 
            DO UPDATE SET 
              name = EXCLUDED.name,
              price = EXCLUDED.price,
              category = EXCLUDED.category,
              in_stock = EXCLUDED.in_stock,
              images_url = EXCLUDED.images_url,
              updated_at = CURRENT_TIMESTAMP
          `, [
            product.id,
            product.name,
            product.price,
            product.category,
            product.inStock,
            JSON.stringify(product.imagesUrl)
          ]);
        }

        return res.status(200).json({ 
          message: 'Productos actualizados correctamente',
          count: products.length
        });

      case 'PUT':
        // Actualizar stock de un producto específico
        const { id, inStock } = req.body;
        
        if (id === undefined || inStock === undefined) {
          return res.status(400).json({ error: 'Se requieren id e inStock' });
        }

        const updateResult = await query(`
          UPDATE products 
          SET in_stock = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `, [Boolean(inStock), parseInt(id)]);

        if (updateResult.rows.length === 0) {
          return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const updatedProduct = updateResult.rows[0];
        // Convertir images_url de JSON string a array
        if (typeof updatedProduct.images_url === 'string') {
          updatedProduct.images_url = JSON.parse(updatedProduct.images_url);
        }

        return res.status(200).json(updatedProduct);

      case 'DELETE':
        // Eliminar un producto
        const { id: deleteId } = req.query;
        
        if (!deleteId) {
          return res.status(400).json({ error: 'Se requiere ID del producto' });
        }

        const deleteResult = await query(
          'DELETE FROM products WHERE id = $1 RETURNING id',
          [parseInt(deleteId)]
        );

        if (deleteResult.rows.length === 0) {
          return res.status(404).json({ error: 'Producto no encontrado' });
        }

        return res.status(200).json({ 
          message: 'Producto eliminado',
          id: deleteResult.rows[0].id
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error en la API:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}