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
  
  console.log('Headers recibidos:', req.headers);
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
    
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      tokenType = 'Bearer';
    } else if (authHeader.startsWith('bearer_')) {
      token = authHeader.substring(7);
      tokenType = 'bearer_';
    } else {
      return res.status(200).json({
        authenticated: false,
        message: 'Formato de token no reconocido',
        format: authHeader.substring(0, 20)
      });
    }

    // Intentar decodificar
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    return res.status(200).json({
      authenticated: true,
      tokenType,
      user: decoded,
      expired: decoded.exp && decoded.exp < Date.now(),
      expiresAt: decoded.exp ? new Date(decoded.exp).toISOString() : 'no expiration'
    });
    
  } catch (error) {
    return res.status(200).json({
      authenticated: false,
      error: error.message,
      authHeader: authHeader.substring(0, 50) + '...'
    });
  }
}