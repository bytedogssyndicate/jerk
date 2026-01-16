/**
 * Controlador de autenticación (authController)
 * Maneja operaciones de login
 */

// Datos simulados de usuarios para autenticación
const validUsers = [
  { username: 'admin', password: 'admin123' },
  { username: 'user', password: 'user123' }
];

// Función de login
function login(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const credentials = JSON.parse(body);
      const user = validUsers.find(u => 
        u.username === credentials.username && 
        u.password === credentials.password
      );
      
      if (user) {
        // Simular generación de token JWT
        const token = `fake-jwt-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          token: token,
          message: 'Login exitoso'
        }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          message: 'Credenciales inválidas' 
        }));
      }
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Datos inválidos' }));
    }
  });
}

module.exports = {
  login
};