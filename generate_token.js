const jwt = require('jsonwebtoken');

// Generar un token JWT de prueba
const payload = { userId: 1, username: 'testuser', role: 'user' };
const secret = 'secret-jwt-key';

const token = jwt.sign(payload, secret, { expiresIn: '1h' });

console.log('Token JWT generado:');
console.log(token);