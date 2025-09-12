// api/products.js - API publica para obtener productos
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`📦 API Products: ${req.method} ${req.url}`);

  try {
    switch (req.method) {
      case 'GET':
        if (req.query.id) {
          // Obtener un producto especifico
          console.log(`🔍 Buscando producto ID: ${req.query.id}`);
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
          
          console.log(`✅ Producto encontrado: ${product.name}`);
          return res.status(200).json(product);
        } else {
          // Obtener todos los productos
          console.log('📋 Obteniendo todos los productos...');
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
            ORDER BY 
              CASE WHEN featured = true THEN 0 ELSE 1 END,
              sort_order ASC,
              category ASC, 
              name ASC
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
          
          console.log(`✅ Enviando ${products.length} productos publicos`);
          return res.status(200).json(products);
        }

      case 'PUT':
        // Actualizar solo el stock de un producto
        console.log('🔄 Actualizando stock...');
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

        console.log(`✅ Stock actualizado: ${updatedProduct.name}`);
        return res.status(200).json({
          message: 'Stock actualizado exitosamente',
          product: updatedProduct
        });

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('❌ Error en products API:', error);
    
    if (error.code) {
      console.error('📊 Codigo de error DB:', error.code);
    }
    
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error de base de datos',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
};