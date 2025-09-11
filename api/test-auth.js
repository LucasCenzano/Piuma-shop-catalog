// api/test-auth.js - Endpoint para probar autenticación
module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;
  
  console.log('Headers recibidos:', Object.keys(req.headers));
  console.log('Auth header:', authHeader);

  if (!authHeader) {
    return res.status(200).json({
      authenticated: false,
      message: 'No se recibió header de autorización',
      headers: Object.keys(req.headers)
    });
  }

  try {
    let token;
    let tokenType;
    
    // Manejar diferentes formatos de token
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      tokenType = 'Bearer';
    } else if (authHeader.startsWith('bearer_')) {
      // Este es el formato que usamos
      token = authHeader.substring(7);
      tokenType = 'bearer_';
    } else {
      return res.status(200).json({
        authenticated: false,
        message: 'Formato de token no reconocido',
        format: authHeader.substring(0, 20)
      });
    }

    // Intentar decodificar el token
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Verificar expiración
    const isExpired = decoded.exp && decoded.exp < Date.now();
    
    return res.status(200).json({
      authenticated: !isExpired,
      tokenType,
      user: decoded,
      expired: isExpired,
      expiresAt: decoded.exp ? new Date(decoded.exp).toISOString() : 'no expiration'
    });
    
  } catch (error) {
    return res.status(200).json({
      authenticated: false,
      error: error.message,
      authHeader: authHeader.substring(0, 50) + '...'
    });
  }
};