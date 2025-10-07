const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Importar configuración y middleware
const securityConfig = require('./config/security');
const { authenticate, requireRole } = require('./middleware/auth');
const { loginLimiter, apiLimiter } = require('./middleware/rateLimiter');
const { loginValidation, productValidation } = require('./utils/validators');
const { generateAccessToken, generateRefreshToken } = require('./utils/tokenService');
const { validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper para queries
async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// ========== MIDDLEWARE GLOBAL ==========
app.use(helmet()); // Seguridad headers HTTP
app.use(cors(securityConfig.cors));
app.use(express.json({ limit: '10mb' }));
app.use(apiLimiter); // Rate limit general

// Logging middleware (desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ========== RUTAS DE AUTENTICACIÓN ==========

// Login
app.post('/api/auth', loginLimiter, loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Datos inválidos',
      details: errors.array()
    });
  }

  try {
    const { username, password } = req.body;

    const userResult = await query(
      'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Cuenta desactivada',
        code: 'ACCOUNT_DISABLED'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

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
    
    const accessToken = generateAccessToken(userData);
    const refreshToken = generateRefreshToken(userData);

    res.json({
      success: true,
      token: accessToken,
      refreshToken: refreshToken,
      user: userData
    });

  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Verificar token
app.get('/api/auth/verify', authenticate, (req, res) => {
  res.json({
    authenticated: true,
    user: req.user
  });
});

// Cambiar contraseña
app.post('/api/auth/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Contraseñas requeridas' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Nueva contraseña debe tener mínimo 8 caracteres' 
      });
    }

    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isCurrentValid = await bcrypt.compare(
      currentPassword, 
      userResult.rows[0].password_hash
    );
    
    if (!isCurrentValid) {
      return res.status(401).json({ 
        error: 'Contraseña actual incorrecta' 
      });
    }

    const newHash = await bcrypt.hash(newPassword, securityConfig.bcrypt.rounds);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newHash, req.user.id]
    );

    res.json({ 
      success: true, 
      message: 'Contraseña actualizada' 
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== RUTAS DE PRODUCTOS (PÚBLICAS) ==========

app.get('/api/products', async (req, res) => {
  try {
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
      
      return res.json(product);
    }

    const result = await query(
      'SELECT * FROM products WHERE is_active = true ORDER BY category, name'
    );
    
    const products = result.rows.map(p => {
      if (typeof p.images_url === 'string') {
        p.images_url = JSON.parse(p.images_url);
      }
      return p;
    });
    
    res.json(products);

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== RUTAS ADMIN (PROTEGIDAS) ==========

// Obtener productos (admin)
app.get('/api/admin/products', 
  authenticate, 
  requireRole('admin'), 
  async (req, res) => {
    try {
      const result = await query(
        'SELECT * FROM products WHERE is_active = true ORDER BY category, name'
      );
      
      const products = result.rows.map(p => {
        if (typeof p.images_url === 'string') {
          p.images_url = JSON.parse(p.images_url);
        }
        return p;
      });
      
      res.json(products);
    } catch (error) {
      console.error('Error en admin/products:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Crear producto
app.post('/api/admin/products',
  authenticate,
  requireRole('admin'),
  productValidation,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    try {
      const { name, price, category, description, inStock, imagesUrl } = req.body;

      const maxIdResult = await query(
        'SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM products'
      );
      const nextId = maxIdResult.rows[0].next_id;

      const result = await query(`
        INSERT INTO products (id, name, price, category, description, in_stock, images_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        nextId,
        name,
        price || '',
        category,
        description || '',
        inStock !== undefined ? inStock : true,
        JSON.stringify(imagesUrl || [])
      ]);

      const product = result.rows[0];
      if (typeof product.images_url === 'string') {
        product.images_url = JSON.parse(product.images_url);
      }

      res.status(201).json({
        message: 'Producto creado',
        product
      });

    } catch (error) {
      console.error('Error creando producto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Actualizar producto
app.put('/api/admin/products/:id',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const fields = [];
      const values = [];
      let paramCount = 1;

      const allowedFields = ['name', 'price', 'category', 'description', 'inStock', 'imagesUrl'];
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          const dbField = field === 'inStock' ? 'in_stock' 
                        : field === 'imagesUrl' ? 'images_url' 
                        : field;
          
          fields.push(`${dbField} = $${paramCount}`);
          
          if (field === 'imagesUrl') {
            values.push(JSON.stringify(updates[field]));
          } else {
            values.push(updates[field]);
          }
          
          paramCount++;
        }
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(parseInt(id));

      const result = await query(`
        UPDATE products 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const product = result.rows[0];
      if (typeof product.images_url === 'string') {
        product.images_url = JSON.parse(product.images_url);
      }

      res.json({
        message: 'Producto actualizado',
        product
      });

    } catch (error) {
      console.error('Error actualizando producto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Eliminar producto (versión corregida con "soft delete")
app.delete('/api/admin/products/:id',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Cambiamos DELETE por UPDATE para hacer un "soft delete"
      const result = await query(
        'UPDATE products SET is_active = false WHERE id = $1 RETURNING id, name',
        [parseInt(id)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      // Cambiamos el mensaje de éxito
      res.json({ 
        message: 'Producto desactivado exitosamente',
        deactivatedProduct: result.rows[0]
      });

    } catch (error) {
      console.error('Error desactivando producto:', error);
      
      // ✅ AÑADIMOS MANEJO DE ERROR ESPECÍFICO
      // Si el error es por una foreign key (código 23503 de PostgreSQL)...
      if (error.code === '23503') {
        // Devolvemos un error 409 Conflict, que es más descriptivo
        return res.status(409).json({ 
          error: 'Este producto no se puede modificar porque está asociado a una o más ventas.' 
        });
      }

      // Para cualquier otro error, mantenemos el 500
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// ========== RUTAS DE VENTAS (PROTEGIDAS) ==========


console.log('🔗 Conectando rutas de ventas y estadísticas...');
const salesHandler = require('./api/sales.js');
const salesStatsHandler = require('./api/sales-stats.js');

// Cualquier petición a /api/sales será manejada por el archivo api/sales.js
app.all('/api/sales', salesHandler);

// Cualquier petición a /api/sales-stats será manejada por api/sales-stats.js
app.all('/api/sales-stats', salesStatsHandler);

console.log('✅ Rutas de ventas y estadísticas conectadas.');

// ========== UTILIDADES ==========

app.get('/api/health', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as current_time');
    res.json({ 
      status: 'OK',
      database: 'connected',
      time: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor solo si se ejecuta directamente (para desarrollo local)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor de desarrollo ejecutándose en http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Exportar la app para Vercel
module.exports = app;