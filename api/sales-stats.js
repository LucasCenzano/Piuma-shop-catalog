// api/sales-stats.js - API para estadísticas de ventas
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// api/sales.js y api/sales-stats.js

// 👇 REEMPLAZA TODA TU FUNCIÓN "validateToken" CON ESTA VERSIÓN MEJORADA

function validateToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Formato de token inválido o ausente. Se esperaba "Bearer {token}".' };
  }

  try {
    const token = authHeader.substring(7); // Extrae el token después de 'Bearer '
    
    // Tu token no es un JWT estándar, así que continuamos con tu lógica de decodificación
    // NOTA: Esta decodificación no es segura para producción sin una verificación de firma.
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
    
    // Si el token es un JWT estándar
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) {
      return { valid: false, error: 'Token JWT inválido (sin payload)' };
    }

    const decodedJson = atob(payloadBase64);
    const decodedPayload = JSON.parse(decodedJson);

    if (decodedPayload.exp * 1000 < Date.now()) {
      return { valid: false, error: 'Token expirado' };
    }

    if (decodedPayload.role !== 'admin') {
      return { valid: false, error: 'Sin permisos de administrador' };
    }

    return { valid: true, user: decodedPayload };

  } catch (error) {
    console.error('Error validando token:', error);
    return { valid: false, error: 'Token dañado o inválido' };
  }
}

module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Validar token
  const authHeader = req.headers.authorization;
  const tokenValidation = validateToken(authHeader);
  
  if (!tokenValidation.valid) {
    return res.status(401).json({ 
      error: 'No autorizado',
      details: tokenValidation.error 
    });
  }

  try {
    // Obtener periodo de consulta (por defecto últimos 30 días)
    const period = req.query.period || '30';
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    
    let dateFilter = '';
    const queryParams = [];
    
    if (startDate && endDate) {
      dateFilter = 'AND s.created_at BETWEEN $1 AND $2';
      queryParams.push(startDate, endDate);
    } else {
      dateFilter = 'AND s.created_at >= CURRENT_DATE - INTERVAL \'' + period + ' days\'';
    }
    
    // 1. Estadísticas generales
    const generalStats = await query(`
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_sale,
        COUNT(CASE WHEN payment_method = 'efectivo' THEN 1 END) as cash_sales,
        COUNT(CASE WHEN payment_method = 'transferencia' THEN 1 END) as transfer_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'efectivo' THEN total_amount ELSE 0 END), 0) as cash_revenue,
        COALESCE(SUM(CASE WHEN payment_method = 'transferencia' THEN total_amount ELSE 0 END), 0) as transfer_revenue
      FROM sales s
      WHERE 1=1 ${dateFilter}
    `, queryParams);
    
    // 2. Ventas por día (últimos días)
    const dailySales = await query(`
      SELECT 
        DATE(s.created_at) as date,
        COUNT(*) as sales_count,
        COALESCE(SUM(s.total_amount), 0) as daily_revenue
      FROM sales s
      WHERE 1=1 ${dateFilter}
      GROUP BY DATE(s.created_at)
      ORDER BY date DESC
      LIMIT 30
    `, queryParams);
    
    // 3. Productos más vendidos
    const topProducts = await query(`
      SELECT 
        p.id,
        p.name,
        p.category,
        SUM(si.quantity) as total_quantity_sold,
        COALESCE(SUM(si.subtotal), 0) as total_revenue,
        COUNT(DISTINCT s.id) as times_sold,
        COALESCE(AVG(si.unit_price), 0) as avg_price
      FROM products p
      JOIN sale_items si ON p.id = si.product_id
      JOIN sales s ON si.sale_id = s.id
      WHERE 1=1 ${dateFilter}
      GROUP BY p.id, p.name, p.category
      ORDER BY total_quantity_sold DESC
      LIMIT 10
    `, queryParams);
    
    // 4. Ventas por categoría
    const categoryStats = await query(`
      SELECT 
        p.category,
        COUNT(DISTINCT s.id) as sales_count,
        SUM(si.quantity) as items_sold,
        COALESCE(SUM(si.subtotal), 0) as category_revenue
      FROM products p
      JOIN sale_items si ON p.id = si.product_id
      JOIN sales s ON si.sale_id = s.id
      WHERE 1=1 ${dateFilter}
      GROUP BY p.category
      ORDER BY category_revenue DESC
    `, queryParams);
    
    // 5. Clientes frecuentes
    const topCustomers = await query(`
      SELECT 
        customer_name,
        customer_lastname,
        customer_phone,
        customer_email,
        COUNT(*) as total_purchases,
        COALESCE(SUM(total_amount), 0) as total_spent,
        COALESCE(AVG(total_amount), 0) as average_purchase,
        MAX(created_at) as last_purchase
      FROM sales s
      WHERE 1=1 ${dateFilter}
      GROUP BY customer_name, customer_lastname, customer_phone, customer_email
      ORDER BY total_spent DESC
      LIMIT 10
    `, queryParams);
    
    // 6. Métodos de pago
    const paymentMethods = await query(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as revenue,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM sales s
      WHERE 1=1 ${dateFilter}
      GROUP BY payment_method
      ORDER BY count DESC
    `, queryParams);
    
    // 7. Ventas por hora del día
    const hourlySales = await query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as sales_count,
        COALESCE(SUM(total_amount), 0) as hourly_revenue
      FROM sales s
      WHERE 1=1 ${dateFilter}
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `, queryParams);
    
    // Construir respuesta
    const stats = {
      period: {
        days: period,
        start_date: startDate || `${period} días atrás`,
        end_date: endDate || 'hoy'
      },
      general: generalStats.rows[0],
      daily_sales: dailySales.rows,
      top_products: topProducts.rows,
      category_stats: categoryStats.rows,
      top_customers: topCustomers.rows,
      payment_methods: paymentMethods.rows,
      hourly_distribution: hourlySales.rows
    };
    
    console.log(`📊 Estadísticas de ventas consultadas por ${tokenValidation.user.username}`);
    
    return res.status(200).json(stats);
    
  } catch (error) {
    console.error('Error en sales-stats API:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message
    });
  }
};