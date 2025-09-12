// test-db.js - Script para probar la conexión a la base de datos
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testDatabase() {
  console.log('🔌 Probando conexión a la base de datos...\n');
  
  try {
    // Test 1: Conexión básica
    console.log('1️⃣ Probando conexión básica...');
    const client = await pool.connect();
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log('✅ Conexión exitosa');
    console.log(`⏰ Hora del servidor: ${timeResult.rows[0].current_time}\n`);
    
    // Test 2: Verificar tabla products
    console.log('2️⃣ Verificando tabla products...');
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'products'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Tabla "products" no existe');
      console.log('💡 Ejecuta: npm run setup\n');
      client.release();
      return;
    }
    
    console.log('✅ Tabla "products" existe\n');
    
    // Test 3: Contar productos
    console.log('3️⃣ Contando productos...');
    const countResult = await client.query('SELECT COUNT(*) as total FROM products');
    const totalProducts = parseInt(countResult.rows[0].total);
    console.log(`📊 Total de productos: ${totalProducts}\n`);
    
    if (totalProducts === 0) {
      console.log('⚠️ No hay productos en la base de datos');
      console.log('💡 Opciones:');
      console.log('   - Ejecutar: npm run setup');
      console.log('   - Agregar productos desde el panel admin');
      console.log('   - Ejecutar el script SQL de mejoras\n');
    } else {
      // Test 4: Obtener algunos productos de ejemplo
      console.log('4️⃣ Productos de ejemplo:');
      const sampleResult = await client.query(`
        SELECT id, name, category, in_stock 
        FROM products 
        ORDER BY id 
        LIMIT 5
      `);
      
      sampleResult.rows.forEach(product => {
        const stockIcon = product.in_stock ? '✅' : '❌';
        console.log(`  ${stockIcon} ${product.id}. ${product.name} (${product.category})`);
      });
      console.log('');
    }
    
    // Test 5: Verificar estructura de columnas
    console.log('5️⃣ Verificando estructura de la tabla...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Columnas disponibles:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    client.release();
    console.log('\n🎉 Pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('📊 Código de error:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Posibles soluciones:');
      console.log('   - Verificar que DATABASE_URL esté correctamente configurada');
      console.log('   - Verificar conexión a internet');
      console.log('   - Verificar que el servidor Neon esté funcionando');
    } else if (error.code === '28P01') {
      console.log('\n💡 Error de autenticación:');
      console.log('   - Verificar usuario y contraseña en DATABASE_URL');
      console.log('   - Verificar que la base de datos esté activa en Neon');
    }
  } finally {
    await pool.end();
  }
}

// Ejecutar test
testDatabase().catch(console.error);