// api/customers.js
const { Pool } = require('pg');
const authService = require('../authService'); // Ajusta la ruta según tu estructura

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function handler(req, res) {
  try {
    // Verificación de autenticación básica
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Verificar el token
    const user = await authService.verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    if (req.method === 'GET') {
      // Obtener todos los clientes
      const { rows } = await pool.query('SELECT * FROM customers ORDER BY name ASC');
      res.status(200).json(rows);

    } else if (req.method === 'POST') {
      // Crear un nuevo cliente
      const { name, lastname, phone, email } = req.body;

      if (!name || !lastname) {
        return res.status(400).json({ error: 'Nombre y apellido son requeridos' });
      }

      const { rows } = await pool.query(
        'INSERT INTO customers (name, lastname, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, lastname, phone, email]
      );
      res.status(201).json(rows[0]);

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error en API de clientes:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
}

module.exports = handler;