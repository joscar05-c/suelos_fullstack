/**
 * Script para probar la autenticación JWT
 * Uso: node test-auth.js
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('🔍 DIAGNÓSTICO JWT\n');
console.log('=====================================');

// 1. Verificar que JWT_SECRET esté cargado
const secret = process.env.JWT_SECRET || 'suelos-secret-key-2025';
console.log('✅ JWT_SECRET cargado:', secret.substring(0, 20) + '...');
console.log('📏 Longitud:', secret.length, 'caracteres\n');

// 2. Generar un token de prueba
const payload = {
  sub: 1,
  email: 'test@example.com',
  iat: Math.floor(Date.now() / 1000)
};

console.log('📦 Payload de prueba:', payload);

const token = jwt.sign(payload, secret, { expiresIn: '7d' });
console.log('\n🔐 Token generado:');
console.log(token);

// 3. Verificar el token
try {
  const decoded = jwt.verify(token, secret);
  console.log('\n✅ Token verificado correctamente!');
  console.log('📋 Datos decodificados:', decoded);
} catch (error) {
  console.error('\n❌ Error al verificar token:', error.message);
}

// 4. Probar con un token antiguo (si existe)
console.log('\n=====================================');
console.log('💡 Si tienes un token guardado en el frontend,');
console.log('   pégalo aquí para verificarlo:\n');
console.log('   Ejemplo: node test-auth.js "tu-token-aqui"');

if (process.argv[2]) {
  console.log('\n🔍 Verificando token proporcionado...');
  try {
    const decoded = jwt.verify(process.argv[2], secret);
    console.log('✅ Token VÁLIDO!');
    console.log('📋 Datos:', decoded);
  } catch (error) {
    console.error('❌ Token INVÁLIDO:', error.message);
    console.log('\n🔧 Solución: Necesitas hacer login de nuevo');
  }
}
