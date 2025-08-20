// api/auth.js - API de autenticación para Vercel

// Configuración de administradores
const ADMIN_USERS = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@piuma.com',
    // Contraseña: "admin123" (sin hash para simplicidad)
    password: 'admin123'
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'piuma-secret-key-change-in-production';

export default async function handler(req, res) {
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

    console.log('Login attempt:', { username, password }); // Para debug

    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son requeridos' });
    }

    // Buscar usuario
    const user = ADMIN_USERS.find(u => u.username === username || u.email === username);
    
    if (!user) {
      console.log('Usuario no encontrado:', username);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña (comparación directa)
    if (password !== user.password) {
      console.log('Contraseña incorrecta para:', username);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    console.log('Login exitoso para:', username);

    // Generar token simple
    const token = `token-${user.id}-${Date.now()}`;

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Error en auth API:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}