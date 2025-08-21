// api/auth.js - API de autenticación SIN dependencias externas
module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son requeridos' });
    }

    // Verificación directa - Usuario: admin, Contraseña: admin123
    if (username === 'admin' && password === 'admin123') {
      const user = {
        id: 1,
        username: 'admin',
        email: 'admin@piuma.com',
        role: 'admin'
      };
      
      // Crear token simple sin JWT
      const tokenData = {
        ...user,
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
      };
      
      const token = 'bearer_' + Buffer.from(JSON.stringify(tokenData)).toString('base64');

      return res.status(200).json({
        success: true,
        token,
        user
      });
    } else {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

  } catch (error) {
    console.error('Error en auth API:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}