// api/admin/products.js - API protegida para administración de productos
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Configuración de la conexión a Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'piuma-secret-key-change-in-production';

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

// Middleware de autenticación
function requireAuth(handler) {
  return async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado - Token requerido' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'No autorizado - Token inválido' });
    }
  };
}

async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      
      case 'POST':
        return await handlePost(req, res);
      
      case 'PUT':
        return await handlePut(req, res);
      
      case 'DELETE':
        return await handleDelete(req, res);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error en admin products API:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleGet(req, res) {
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
    if (typeof product.images_url === 'string') {
      product.images_url = JSON.parse(product.images_url);
    }
    
    return res.status(200).json(product);
  } else {
    // Obtener todos los productos con información adicional para admin
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
}

async function handlePost(req, res) {
  // Crear nuevo producto
  const { name, price, category, inStock, imagesUrl } = req.body;
  
  if (!name || !category) {
    return res.status(400).json({ error: 'Nombre y categoría son requeridos' });
  }

  // Obtener el siguiente ID disponible
  const maxIdResult = await query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM products');
  const nextId = maxIdResult.rows[0].next_id;

  const result = await query(`
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

  const newProduct = result.rows[0];
  if (typeof newProduct.images_url === 'string') {
    newProduct.images_url = JSON.parse(newProduct.images_url);
  }

  return res.status(201).json({
    message: 'Producto creado exitosamente',
    product: newProduct
  });
}

async function handlePut(req, res) {
  // Actualizar producto existente
  const { id, name, price, category, inStock, imagesUrl } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'ID del producto es requerido' });
  }

  // Construir query dinámicamente basado en campos proporcionados
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(name);
  }
  if (price !== undefined) {
    updates.push(`price = $${paramCount++}`);
    values.push(price);
  }
  if (category !== undefined) {
    updates.push(`category = $${paramCount++}`);
    values.push(category);
  }
  if (inStock !== undefined) {
    updates.push(`in_stock = $${paramCount++}`);
    values.push(inStock);
  }
  if (imagesUrl !== undefined) {
    updates.push(`images_url = $${paramCount++}`);
    values.push(JSON.stringify(imagesUrl));
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(parseInt(id));

  const updateQuery = `
    UPDATE products 
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const result = await query(updateQuery, values);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const updatedProduct = result.rows[0];
  if (typeof updatedProduct.images_url === 'string') {
    updatedProduct.images_url = JSON.parse(updatedProduct.images_url);
  }

  return res.status(200).json({
    message: 'Producto actualizado exitosamente',
    product: updatedProduct
  });
}

async function handleDelete(req, res) {
  // Eliminar producto
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'ID del producto es requerido' });
  }

  const result = await query(
    'DELETE FROM products WHERE id = $1 RETURNING id, name',
    [parseInt(id)]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  return res.status(200).json({ 
    message: 'Producto eliminado exitosamente',
    deletedProduct: result.rows[0]
  });
}

// Exportar con autenticación requerida
module.exports = requireAuth(handler);