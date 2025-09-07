// generateHash.js - Script para generar hash de contraseña
const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'Piuma@!07';
  const saltRounds = 10;

  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Hash generado para "Piuma@!07":');
    console.log(hash);

    // Verificar que funciona
    const isValid = await bcrypt.compare(password, hash);
    console.log('\nVerificación:', isValid ? '✅ Válido' : '❌ Inválido');
  } catch (error) {
    console.error('Error:', error);
  }
}

generateHash();