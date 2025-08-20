// setup.js - Script para configurar la base de datos Neon PostgreSQL inicial
const { Pool } = require('pg');
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

// Función para cargar datos desde data.js de forma dinámica
function loadProductData() {
  try {
    // Leer el archivo data.js como texto
    const dataPath = path.join(__dirname, 'src', 'data.js');
    const dataContent = fs.readFileSync(dataPath, 'utf8');
    
    // Buscar el array de productos usando expresión regular
    const bagsMatch = dataContent.match(/const bags = \[([\s\S]*?)\];/);
    if (!bagsMatch) {
      throw new Error('No se pudo encontrar el array de productos en data.js');
    }
    
    // Crear un array básico con la información esencial para la DB
    const productsData = [];
    
    // Extraer cada producto usando regex
    const productMatches = dataContent.matchAll(/{\s*id:\s*(\d+),\s*name:\s*"([^"]+)",\s*price:\s*"([^"]*)",[\s\S]*?category:\s*"([^"]+)",[\s\S]*?inStock:\s*(true|false)/g);
    
    for (const match of productMatches) {
      const [, id, name, price, category, inStock] = match;
      productsData.push({
        id: parseInt(id),
        name: name,
        price: price,
        category: category,
        inStock: inStock === 'true',
        imagesUrl: [] // Las imágenes las manejamos desde el frontend
      });
    }
    
    console.log(`📦 Cargados ${productsData.length} productos desde data.js`);
    return productsData;
    
  } catch (error) {
    console.error('❌ Error cargando data.js:', error.message);
    console.log('💡 Usando datos de ejemplo...');
    
    // Datos de ejemplo si falla la carga
    return [
      { id: 1, name: "Eclipse", price: "$25.000", category: "Bandoleras", inStock: true, imagesUrl: [] },
      { id: 2, name: "Estepa", price: "$28.000", category: "Bandoleras", inStock: true, imagesUrl: [] },
      { id: 5, name: "Amayra", price: "$45.000", category: "Carteras", inStock: true, imagesUrl: [] },
      { id: 21, name: "Brujula", price: "$20.000", category: "Billeteras", inStock: true, imagesUrl: [] }
    ];
  }
}

async function setupDatabase() {
  console.log('🚀 Iniciando configuración de la base de datos Neon PostgreSQL...');
  
  // Cargar datos del archivo data.js
  const localBagsData = loadProductData();
  
  const client = await pool.connect();
  
  try {
    // Crear tabla si no existe
    console.log('📋 Creando tabla products...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price VARCHAR(50),
        category VARCHAR(100) NOT NULL,
        in_stock BOOLEAN DEFAULT true,
        images_url JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla products creada/verificada');

    // Insertar datos locales
    console.log('📦 Insertando productos desde data.js...');
    let insertedCount = 0;
    let updatedCount = 0;

    for (const product of localBagsData) {
      const result = await client.query(`
        INSERT INTO products (id, name, price, category, in_stock, images_url, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (id) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          category = EXCLUDED.category,
          in_stock = EXCLUDED.in_stock,
          images_url = EXCLUDED.images_url,
          updated_at = CURRENT_TIMESTAMP
        RETURNING (xmax = 0) AS inserted
      `, [
        product.id,
        product.name,
        product.price,
        product.category,
        product.inStock,
        JSON.stringify(product.imagesUrl)
      ]);

      if (result.rows[0].inserted) {
        insertedCount++;
      } else {
        updatedCount++;
      }
    }

    console.log(`✅ Procesados: ${insertedCount} nuevos, ${updatedCount} actualizados`);
    
    // Verificar que los datos se cargaron correctamente
    console.log('🔍 Verificando datos...');
    const countResult = await client.query('SELECT COUNT(*) as total FROM products');
    const totalProducts = parseInt(countResult.rows[0].total);
    console.log(`📊 Total de productos en la base de datos: ${totalProducts}`);
    
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

    // Mostrar algunos productos de ejemplo
    const sampleResult = await client.query(`
      SELECT id, name, category, in_stock 
      FROM products 
      ORDER BY id 
      LIMIT 5
    `);
    
    console.log('🎒 Productos de ejemplo:');
    sampleResult.rows.forEach(row => {
      const stockStatus = row.in_stock ? '✅' : '❌';
      console.log(`  ${stockStatus} ${row.id}. ${row.name} (${row.category})`);
    });
    
    console.log('🎉 Configuración de Neon PostgreSQL completada exitosamente!');
    console.log('🌐 Tu catálogo ahora puede gestionar el stock desde la base de datos en la nube');
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
    console.error('💡 Verifica que tu DATABASE_URL esté correctamente configurada en .env.local');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
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

module.exports = { setupDatabase, testConnection };