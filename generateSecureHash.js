// generateSecureHash.js - Generador de hash seguro para contraseñas
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function generateSecureHash() {
  console.log('🔐 Generador de Hash Seguro para Piuma Admin\n');
  console.log('Este script te ayudará a generar un hash seguro para tu contraseña de administrador.\n');
  
  // Solicitar nueva contraseña
  const password = await new Promise((resolve) => {
    rl.question('Ingresa la nueva contraseña de administrador (mínimo 8 caracteres): ', (input) => {
      resolve(input.trim());
    });
  });

  // Validaciones básicas
  if (password.length < 8) {
    console.log('❌ La contraseña debe tener al menos 8 caracteres');
    rl.close();
    return;
  }

  if (password.toLowerCase().includes('admin') || password === '12345678' || password === 'password') {
    console.log('❌ La contraseña es muy común. Usa algo más seguro.');
    rl.close();
    return;
  }

  try {
    // Generar hash con salt rounds altos para mayor seguridad
    const saltRounds = 12;
    console.log('\n⏳ Generando hash seguro...');
    
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('\n✅ Hash generado exitosamente!\n');
    console.log('📋 Variables para tu archivo .env.local:');
    console.log('─'.repeat(60));
    console.log(`ADMIN_USERNAME=admin`);
    console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
    console.log('─'.repeat(60));
    
    // Verificar que funciona correctamente
    const isValid = await bcrypt.compare(password, hash);
    console.log('\n🔍 Verificación del hash:', isValid ? '✅ Correcto' : '❌ Error');
    
    console.log('\n📝 Pasos siguientes:');
    console.log('1. Copia las variables de arriba a tu archivo .env.local');
    console.log('2. Actualiza tu archivo api/auth.js para usar estas variables');
    console.log('3. Reinicia tu servidor de desarrollo');
    console.log('4. Prueba el login con tu nueva contraseña');
    
    // Mostrar ejemplo de uso en Vercel
    console.log('\n🚀 Para Vercel (Producción):');
    console.log('Ve a tu dashboard de Vercel > Settings > Environment Variables');
    console.log('Y agrega las mismas variables de arriba.');
    
  } catch (error) {
    console.error('❌ Error generando hash:', error.message);
  }
  
  rl.close();
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  generateSecureHash().catch(console.error);
}

module.exports = { generateSecureHash };