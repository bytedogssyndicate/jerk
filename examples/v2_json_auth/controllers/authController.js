const jwt = require('jsonwebtoken');
const { TokenManager } = require('../../../index.js');

// TokenManager para este controlador
const tokenManager = new TokenManager({
  storage: 'json',
  tokenFile: './tokens.json'
});

const authController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      // Validación simple de credenciales (esto debería ser más robusto en producción)
      if (!username || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Nombre de usuario y contraseña requeridos' }));
        return;
      }

      // Simulación de autenticación (en una aplicación real, esto verificaría contra una base de datos)
      if (username === 'admin' && password === 'password') {
        // Generar un token JWT
        const payload = { 
          userId: 1, 
          username: username,
          role: 'admin'
        };
        
        // Secret para firmar el token (en producción, debería estar en variables de entorno)
        const secret = 'super-secret-key-for-json-example';
        const token = jwt.sign(payload, secret, { expiresIn: '1h' });

        // En este ejemplo con almacenamiento JSON, no almacenamos el token en sí
        // pero podríamos registrar información sobre él si es necesario
        // Alternativamente, podríamos usar el TokenManager para generar un par de tokens
        const tokenPair = tokenManager.generateTokenPair(
          { userId: 1, username: username, role: 'admin' },
          {
            jwtSecret: secret,
            refreshSecret: 'refresh-' + secret,
            accessExpiresIn: '15m',
            refreshExpiresIn: '7d'
          }
        );
        
        // Usamos el token de acceso
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Inicio de sesión exitoso',
          token: tokenPair.accessToken,
          user: payload
        }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Credenciales inválidas' }));
      }
    } catch (error) {
      console.error('Error en login:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error interno del servidor' }));
    }
  }
};

module.exports = authController;