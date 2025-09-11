// setup-with-users.js - Script mejorado con tabla de usuarios
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Configuración de conexión a Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Función helper para queries
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Función para cargar datos de productos (igual que antes)
function loadProductData() {
  try {
    const dataPath = path.join(__dirname, 'src', 'data.js');
    const dataContent = fs.readFileSync(dataPath, 'utf8');
    
    const bagsMatch = dataContent.match(/const bags = \[([\s\S]*?)\];/);
    if (!bagsMatch) {
      throw new Error('No se pudo encontrar el array de productos en data.js');
    }
    
    const productsData = [];
    const productMatches = dataContent.matchAll(/{\s*id:\s*(\d+),\s*name:\s*"([^"]+)",\s*price:\s*"([^"]*)",[\s\S]*?category:\s*"([^"]+)",[\s\S]*?inStock:\s*(true|false)/g);
    
    for (const match of productMatches) {
      const [, id, name, price, category, inStock] = match;
      productsData.push({
        id: parseInt(id),
        name: name,
        price: price,
        category: category,
        inStock: inStock === 'true',
        imagesUrl: []
      });
    }
    
    console.log(`📦 Cargados ${productsData.length} productos desde data.js`);
    return productsData;
    
  } catch (error) {
    console.error('❌ Error cargando data.js:', error.message);
    console.log('💡 Usando datos de ejemplo...');
    
    return [
      { id: 1, name: "Eclipse", price: "$25.000", category: "Bandoleras", inStock: true, imagesUrl: [] },
      { id: 2, name: "Estepa", price: "$28.000", category: "Bandoleras", inStock: true, imagesUrl: [] },
      { id: 5, name: "Amayra", price: "$45.000", category: "Carteras", inStock: true, imagesUrl: [] },
      { id: 21, name: "Brujula", price: "$20.000", category: "Billeteras", inStock: true, imagesUrl: [] }
    ];
  }
}

async function setupDatabase() {
  console.log('🚀 Iniciando configuración de la base de datos con usuarios seguros...');
  
  const localBagsData = loadProductData();
  const client = await pool.connect();
  
  try {
    // 1. Crear tabla de usuarios
    console.log('👤 Creando tabla de usuarios...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);
    console.log('✅ Tabla users creada/verificada');

    // 2. Crear tabla de productos (igual que antes)
    console.log('📋 Creando tabla products...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price VARCHAR(50),
        category VARCHAR(100) NOT NULL,
        description TEXT,
        in_stock BOOLEAN DEFAULT true,
        images_url JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla products creada/verificada');

    // 3. Crear usuario administrador por defecto
    console.log('🔐 Configurando usuario administrador...');
    
    // Verificar si ya existe un usuario admin
    const existingUser = await client.query(
      'SELECT id FROM users WHERE username = $1',
      ['admin']
    );

    if (existingUser.rows.length === 0) {
      // Crear hash de la contraseña
      const defaultPassword = 'Piuma2025!';
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

      await client.query(`
        INSERT INTO users (username, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
      `, ['admin', 'admin@piuma.com', passwordHash, 'admin']);

      console.log('✅ Usuario administrador creado');
      console.log('🔑 Credenciales por defecto:');
      console.log('   Usuario: admin');
      console.log('   Contraseña: Piuma2025!');
      console.log('');
      console.log('⚠️  IMPORTANTE: Cambia estas credenciales después del primer login');
    } else {
      console.log('ℹ️  Usuario administrador ya existe');
    }

    // 4. Insertar productos
    console.log('📦 Insertando productos...');
    let insertedCount = 0;
    let updatedCount = 0;

    for (const product of localBagsData) {
      const result = await client.query(`
        INSERT INTO products (id, name, price, category, description, in_stock, images_url, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        ON CONFLICT (id) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          in_stock = EXCLUDED.in_stock,
          images_url = EXCLUDED.images_url,
          updated_at = CURRENT_TIMESTAMP
        RETURNING (xmax = 0) AS inserted
      `, [
        product.id,
        product.name,
        product.price,
        product.category,
        product.description || '',
        product.inStock,
        JSON.stringify(product.imagesUrl)
      ]);

      if (result.rows[0].inserted) {
        insertedCount++;
      } else {
        updatedCount++;
      }
    }

    console.log(`✅ Productos procesados: ${insertedCount} nuevos, ${updatedCount} actualizados`);
    
    // 5. Verificar datos
    console.log('🔍 Verificando configuración...');
    
    const productCount = await client.query('SELECT COUNT(*) as total FROM products');
    const userCount = await client.query('SELECT COUNT(*) as total FROM users');
    
    console.log(`📊 Total de productos: ${productCount.rows[0].total}`);
    console.log(`👥 Total de usuarios: ${userCount.rows[0].total}`);
    
    // Mostrar resumen por categoría
    const categoryResult = await client.query(`
      SELECT category, COUNT(*) as count, 
             SUM(CASE WHEN in_stock THEN 1 ELSE 0 END) as in_stock_count
      FROM products 
      GROUP BY category 
      ORDER BY category
    `);
    
    console.log('📈 Resumen por categoría:');
    categoryResult.rows.forEach(row => {
      console.log(`  - ${row.category}: ${row.count} productos (${row.in_stock_count} en stock)`);
    });

    console.log('');
    console.log('🎉 Configuración completada exitosamente!');
    console.log('🔐 Sistema de autenticación seguro configurado');
    console.log('🌐 Tu catálogo está listo para usar');
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
    console.error('💡 Verifica que tu DATABASE_URL esté correctamente configurada');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Función para crear un nuevo usuario (opcional)
async function createUser(username, email, password, role = 'admin') {
  console.log(`👤 Creando usuario: ${username}`);
  
  const client = await pool.connect();
  try {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await client.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
    `, [username, email, passwordHash, role]);

    console.log(`✅ Usuario ${username} creado exitosamente`);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      console.error(`❌ El usuario ${username} ya existe`);
    } else {
      console.error('❌ Error creando usuario:', error);
    }
  } finally {
    client.release();
  }
}

// Función para testear la conexión
async function testConnection() {
  console.log('🔌 Probando conexión a Neon...');
  
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    console.error('❌ DATABASE_URL no está configurada');
    console.log('💡 Asegúrate de tener un archivo .env.local con tu URL de conexión');
    return false;
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Conexión exitosa a Neon PostgreSQL');
    console.log(`⏰ Hora del servidor: ${result.rows[0].current_time}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

// Ejecutar si es llamado directamente
async function main() {
  const isConnected = await testConnection();
  if (isConnected) {
    await setupDatabase();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setupDatabase, testConnection, createUser };