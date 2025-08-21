// api/admin/products.js - Versión con autenticación simplificada temporalmente
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificación simple del token (temporal)
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No autorizado - Token requerido' });
  }

  // Por ahora, solo verificamos que exista un token
  // En producción, deberías validarlo correctamente
  console.log('Token recibido, continuando...');

  try {
    switch (req.method) {
      case 'GET':
        if (req.query.id) {
          const result = await query(
            'SELECT * FROM products WHERE id = $1',
            [parseInt(req.query.id)]
          );
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
          }
          
          const product = result.rows[0];
          if (typeof product.images_url === 'string') {
            product.images_url = JSON.parse(product.images_url);
          }
          
          return res.status(200).json(product);
        } else {
          const result = await query(`
            SELECT *, 
              CASE WHEN in_stock THEN 'En Stock' ELSE 'Sin Stock' END as stock_status,
              created_at,
              updated_at
            FROM products 
            ORDER BY category, name
          `);
          
          const products = result.rows.map(product => {
            if (typeof product.images_url === 'string') {
              product.images_url = JSON.parse(product.images_url);
            }
            return product;
          });
          
          return res.status(200).json(products);
        }

      case 'POST':
        const { name, price, category, inStock, imagesUrl } = req.body;
        
        if (!name || !category) {
          return res.status(400).json({ error: 'Nombre y categoría son requeridos' });
        }

        const maxIdResult = await query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM products');
        const nextId = maxIdResult.rows[0].next_id;

        const createResult = await query(`
          INSERT INTO products (id, name, price, category, in_stock, images_url, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `, [
          nextId,
          name,
          price || '',
          category,
          inStock !== undefined ? inStock : true,
          JSON.stringify(imagesUrl || [])
        ]);

        const newProduct = createResult.rows[0];
        if (typeof newProduct.images_url === 'string') {
          newProduct.images_url = JSON.parse(newProduct.images_url);
        }

        return res.status(201).json({
          message: 'Producto creado exitosamente',
          product: newProduct
        });

      case 'PUT':
        const updateData = req.body;
        
        if (!updateData.id) {
          return res.status(400).json({ error: 'ID del producto es requerido' });
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (updateData.name !== undefined) {
          updates.push(`name = $${paramCount++}`);
          values.push(updateData.name);
        }
        if (updateData.price !== undefined) {
          updates.push(`price = $${paramCount++}`);
          values.push(updateData.price);
        }
        if (updateData.category !== undefined) {
          updates.push(`category = $${paramCount++}`);
          values.push(updateData.category);
        }
        if (updateData.inStock !== undefined) {
          updates.push(`in_stock = $${paramCount++}`);
          values.push(updateData.inStock);
        }
        if (updateData.imagesUrl !== undefined) {
          updates.push(`images_url = $${paramCount++}`);
          values.push(JSON.stringify(updateData.imagesUrl));
        }

        if (updates.length === 0) {
          return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(parseInt(updateData.id));

        const updateQuery = `
          UPDATE products 
          SET ${updates.join(', ')}
          WHERE id = $${paramCount}
          RETURNING *
        `;

        const updateResult = await query(updateQuery, values);

        if (updateResult.rows.length === 0) {
          return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const updatedProduct = updateResult.rows[0];
        if (typeof updatedProduct.images_url === 'string') {
          updatedProduct.images_url = JSON.parse(updatedProduct.images_url);
        }

        return res.status(200).json({
          message: 'Producto actualizado exitosamente',
          product: updatedProduct
        });

      case 'DELETE':
        const { id } = req.query;
        
        if (!id) {
          return res.status(400).json({ error: 'ID del producto es requerido' });
        }

        const deleteResult = await query(
          'DELETE FROM products WHERE id = $1 RETURNING id, name',
          [parseInt(id)]
        );

        if (deleteResult.rows.length === 0) {
          return res.status(404).json({ error: 'Producto no encontrado' });
        }

        return res.status(200).json({ 
          message: 'Producto eliminado exitosamente',
          deletedProduct: deleteResult.rows[0]
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error en admin products API:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message
    });
  }
};