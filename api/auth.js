// api/auth.js - API de autenticación para Vercel
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configuración de administradores
const ADMIN_USERS = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@piuma.com',
    // Contraseña: "admin123" hasheada
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
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

    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son requeridos' });
    }

    // Buscar usuario
    const user = ADMIN_USERS.find(u => u.username === username || u.email === username);
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        email: user.email,
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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
      error: 'Error interno del servidor'
    });
  }
}