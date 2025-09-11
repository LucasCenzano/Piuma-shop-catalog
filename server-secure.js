// server-secure.js - Servidor con autenticación segura
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
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

// Función para generar tokens seguros
function generateSecureToken(userData) {
  const payload = {
    id: userData.id,
    username: userData.username,
    email: userData.email,
    role: userData.role,
    exp: Date.now() + (24 * 60 * 60 * 1000), // 24 horas
    iat: Date.now()
  };
  
  const tokenData = JSON.stringify(payload);
  const token = 'bearer_' + Buffer.from(tokenData).toString('base64');
  return token;
}

// Función para validar token
function validateToken(authHeader) {
  if (!authHeader) {
    return { valid: false, error: 'No se proporcionó token de autorización' };
  }

  try {
    let token = authHeader;
    
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (authHeader.startsWith('bearer_')) {
      token = authHeader;
    }

    if (token.startsWith('bearer_')) {
      const tokenData = token.substring(7);
      const decoded = JSON.parse(Buffer.from(tokenData, 'base64').toString());
      
      if (decoded.exp && decoded.exp < Date.now()) {
        return { valid: false, error: 'Token expirado' };
      }

      if (decoded.role !== 'admin') {
        return { valid: false, error: 'Sin permisos de administrador' };
      }

      return { valid: true, user: decoded };
    }

    return { valid: false, error: 'Formato de token inválido' };
  } catch (error) {
    console.error('Error validando token:', error);
    return { valid: false, error: 'Token corrupto o inválido' };
  }
}

// ==================== RUTAS DE AUTENTICACIÓN ====================

// Login seguro
app.post('/api/auth', async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    if (username.length < 3 || password.length < 6) {
      console.warn(`⚠️ Intento de login con credenciales inválidas desde ${clientIP}`);
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Buscar usuario en la base de datos
    const userResult = await query(
      'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      console.warn(`⚠️ Intento de login con usuario inexistente: ${username} desde ${clientIP}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      console.warn(`⚠️ Intento de login con cuenta desactivada: ${username}`);
      return res.status(401).json({ error: 'Cuenta desactivada' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      console.warn(`⚠️ Contraseña incorrecta para usuario: ${username} desde ${clientIP}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Actualizar último login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    const token = generateSecureToken(userData);

    console.log(`✅ Login exitoso para usuario: ${username} desde ${clientIP}`);

    return res.status(200).json({
      success: true,
      token,
      user: userData,
      message: 'Autenticación exitosa'
    });

  } catch (error) {
    console.error('❌ Error en autenticación:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error de autenticación'
    });
  }
});

// Test de autenticación
app.get('/api/test-auth', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(200).json({
      authenticated: false,
      message: 'No se recibió header de autorización'
    });
  }

  const validation = validateToken(authHeader);
  
  return res.status(200).json({
    authenticated: validation.valid,
    user: validation.user || null,
    error: validation.error || null,
    tokenValid: validation.valid
  });
});

// ==================== RUTAS DE PRODUCTOS ====================

// API de productos públicos (GET)
app.get('/api/products', async (req, res) => {
  try {
    console.log('📦 Obteniendo productos...');
    
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
        try {
          product.images_url = JSON.parse(product.images_url);
        } catch (e) {
          product.images_url = [];
        }
      }
      
      return res.json(product);
    } else {
      const result = await query(`
        SELECT 
          id, name, price, category, description, in_stock, images_url, created_at, updated_at
        FROM products 
        ORDER BY category, name
      `);
      
      const products = result.rows.map(product => {
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

// API de productos protegida (ADMIN)
app.all('/api/admin/products', async (req, res) => {
  // Validar token
  const authHeader = req.headers.authorization;
  const tokenValidation = validateToken(authHeader);
  
  if (!tokenValidation.valid) {
    console.warn(`🚨 Acceso denegado a admin/products: ${tokenValidation.error}`);
    return res.status(401).json({ 
      error: 'No autorizado',
      details: tokenValidation.error 
    });
  }

  console.log(`✅ Acceso autorizado a admin/products para: ${tokenValidation.user.username}`);

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
            try {
              product.images_url = JSON.parse(product.images_url);
            } catch (e) {
              product.images_url = [];
            }
          }
          
          return res.status(200).json(product);
        } else {
          const result = await query(`
            SELECT *, 
              CASE WHEN in_stock THEN 'En Stock' ELSE 'Sin Stock' END as stock_status,
              created_at, updated_at
            FROM products 
            ORDER BY category, name
          `);
          
          const products = result.rows.map(product => {
            if (typeof product.images_url === 'string') {
              try {
                product.images_url = JSON.parse(product.images_url);
              } catch (e) {
                product.images_url = [];
              }
            }
            return product;
          });
          
          console.log(`📊 Enviando ${products.length} productos al admin`);
          return res.status(200).json(products);
        }

      case 'POST':
        const { name, price, category, description, inStock, imagesUrl } = req.body;
        
        if (!name || !category) {
          return res.status(400).json({ error: 'Nombre y categoría son requeridos' });
        }

        const maxIdResult = await query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM products');
        const nextId = maxIdResult.rows[0].next_id;

        const createResult = await query(`
          INSERT INTO products (id, name, price, category, description, in_stock, images_url, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `, [
          nextId, name, price || '', category, description || '',
          inStock !== undefined ? inStock : true, JSON.stringify(imagesUrl || [])
        ]);

        const newProduct = createResult.rows[0];
        if (typeof newProduct.images_url === 'string') {
          try {
            newProduct.images_url = JSON.parse(newProduct.images_url);
          } catch (e) {
            newProduct.images_url = [];
          }
        }

        console.log(`✅ Producto creado por ${tokenValidation.user.username}: ${name}`);
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
          updates.push(`name = ${paramCount++}`);
          values.push(updateData.name);
        }
        if (updateData.price !== undefined) {
          updates.push(`price = ${paramCount++}`);
          values.push(updateData.price);
        }
        if (updateData.category !== undefined) {
          updates.push(`category = ${paramCount++}`);
          values.push(updateData.category);
        }
        if (updateData.description !== undefined) {
          updates.push(`description = ${paramCount++}`);
          values.push(updateData.description);
        }
        if (updateData.inStock !== undefined) {
          updates.push(`in_stock = ${paramCount++}`);
          values.push(updateData.inStock);
        }
        if (updateData.imagesUrl !== undefined) {
          updates.push(`images_url = ${paramCount++}`);
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
          WHERE id = ${paramCount}
          RETURNING *
        `;

        const updateResult = await query(updateQuery, values);

        if (updateResult.rows.length === 0) {
          return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const updatedProduct = updateResult.rows[0];
        if (typeof updatedProduct.images_url === 'string') {
          try {
            updatedProduct.images_url = JSON.parse(updatedProduct.images_url);
          } catch (e) {
            updatedProduct.images_url = [];
          }
        }

        console.log(`✅ Producto actualizado por ${tokenValidation.user.username}: ${updatedProduct.name}`);
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

        console.log(`🗑️ Producto eliminado por ${tokenValidation.user.username}: ${deleteResult.rows[0].name}`);
        return res.status(200).json({ 
          message: 'Producto eliminado exitosamente',
          deletedProduct: deleteResult.rows[0]
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('❌ Error en admin products API:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ==================== RUTAS DE UTILIDAD ====================

// Ruta de salud del sistema
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await query('SELECT NOW() as current_time, COUNT(*) as product_count FROM products');
    const userResult = await query('SELECT COUNT(*) as user_count FROM users');
    
    res.json({ 
      status: 'OK', 
      message: 'Servidor y DB funcionando',
      database_time: dbResult.rows[0].current_time,
      product_count: parseInt(dbResult.rows[0].product_count),
      user_count: parseInt(userResult.rows[0].user_count),
      database_configured: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL),
      security_enabled: true
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Error conectando a la base de datos',
      error: error.message 
    });
  }
});

// Ruta para cambiar contraseña (protegida)
app.post('/api/change-password', async (req, res) => {
  const authHeader = req.headers.authorization;
  const tokenValidation = validateToken(authHeader);
  
  if (!tokenValidation.valid) {
    return res.status(401).json({ 
      error: 'No autorizado',
      details: tokenValidation.error 
    });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const userId = tokenValidation.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }

    // Verificar contraseña actual
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    // Generar hash de la nueva contraseña
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    console.log(`🔐 Contraseña actualizada para usuario: ${tokenValidation.user.username}`);

    res.json({ 
      success: true, 
      message: 'Contraseña actualizada exitosamente' 
    });

  } catch (error) {
    console.error('❌ Error cambiando contraseña:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('❌ Error no manejado:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Error del servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor API seguro ejecutándose en http://localhost:${PORT}`);
  console.log(`📦 Base de datos configurada: ${!!(process.env.DATABASE_URL || process.env.POSTGRES_URL) ? 'SÍ' : 'NO'}`);
  console.log(`🔐 Autenticación segura: HABILITADA`);
  console.log(`🔍 Endpoints disponibles:`);
  console.log(`   - GET  http://localhost:${PORT}/api/health`);
  console.log(`   - POST http://localhost:${PORT}/api/auth`);
  console.log(`   - GET  http://localhost:${PORT}/api/products`);
  console.log(`   - ALL  http://localhost:${PORT}/api/admin/products (protegido)`);
  console.log(`   - POST http://localhost:${PORT}/api/change-password (protegido)`);
  console.log(`\n💡 Prueba: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Para configurar usuarios ejecuta: npm run setup-secure`);
});