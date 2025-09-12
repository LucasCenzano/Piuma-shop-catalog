// api/auth.js - API de autenticación SEGURA con prevención de error 431
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  // Configurar CORS de forma más específica para evitar headers grandes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight por 24 horas

  // Manejar preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Content-Length', '0');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Log para debugging
  console.log('🔐 Intento de login recibido');
  console.log('📊 Tamaño de headers:', JSON.stringify(req.headers).length);

  try {
    const { username, password } = req.body;

    // Validaciones básicas
    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son requeridos' });
    }

    if (username.length < 3 || password.length < 6) {
      console.warn(`⚠️ Credenciales con formato inválido: ${username}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Obtener credenciales de variables de entorno
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    
    // Modo fallback temporal para desarrollo
    const fallbackMode = !adminPasswordHash;
    
    if (fallbackMode) {
      console.warn('⚠️ MODO FALLBACK ACTIVO - Usando credenciales de desarrollo');
      console.warn('⚠️ Configura ADMIN_PASSWORD_HASH en variables de entorno para producción');
      
      // Verificación directa temporal (SOLO para desarrollo)
      if (username === 'admin' && password === 'admin123') {
        console.log('✅ Login exitoso en modo fallback');
        return createSuccessResponse(res, { username: adminUsername });
      }
    } else {
      // Modo seguro con hash
      if (username === adminUsername) {
        try {
          const isValidPassword = await bcrypt.compare(password, adminPasswordHash);
          
          if (isValidPassword) {
            console.log(`✅ Login exitoso para usuario: ${username}`);
            return createSuccessResponse(res, { username: adminUsername });
          }
        } catch (hashError) {
          console.error('❌ Error verificando hash:', hashError);
          return res.status(500).json({ 
            error: 'Error interno del servidor',
            code: 'HASH_ERROR'
          });
        }
      }
    }

    // Login fallido
    console.warn(`⚠️ Intento de login fallido: ${username}`);
    
    // Delay para prevenir ataques de fuerza bruta
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return res.status(401).json({ error: 'Credenciales inválidas' });

  } catch (error) {
    console.error('❌ Error en autenticación:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      code: 'AUTH_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Función helper para crear respuesta exitosa (optimizada)
function createSuccessResponse(res, userData) {
  const user = {
    id: 1,
    username: userData.username,
    email: 'admin@piuma.com',
    role: 'admin'
  };
  
  // Token más compacto para evitar headers grandes
  const tokenData = {
    id: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + (4 * 60 * 60 * 1000), // 4 horas
    iat: Date.now()
  };
  
  // Crear token compacto
  const token = 'bearer_' + Buffer.from(JSON.stringify(tokenData)).toString('base64');

  // Respuesta optimizada sin información extra
  const response = {
    success: true,
    token,
    user
  };

  // Headers optimizados para evitar 431
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  return res.status(200).json(response);
}