// api/test-db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    
    return res.status(200).json({ 
      success: true, 
      time: result.rows[0].current_time,
      database_url_exists: !!process.env.DATABASE_URL
    });
  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      code: error.code,
      database_url_exists: !!process.env.DATABASE_URL
    });
  }
}