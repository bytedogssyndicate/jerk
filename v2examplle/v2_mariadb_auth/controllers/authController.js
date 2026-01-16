const jwt = require('jsonwebtoken');
const { MariaDBTokenAdapter } = require('../../../index.js');

// Adaptador de tokens para este controlador
const tokenAdapter = new MariaDBTokenAdapter({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'token_db',
  tableName: 'mariadb_tokens'
});

// Asegurarse de que el adaptador esté inicializado
tokenAdapter.initialize().catch(console.error);

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
        const secret = 'super-secret-key-for-mariadb-example';
        const token = jwt.sign(payload, secret, { expiresIn: '1h' });

        // Guardar el token en la base de datos MariaDB
        await tokenAdapter.saveToken(
          token,
          { userId: 1 },
          'access',
          new Date(Date.now() + 60 * 60 * 1000) // 1 hora
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Inicio de sesión exitoso',
          token: token,
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
  },

  logout: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Token no proporcionado' }));
        return;
      }

      // Revocar el token en la base de datos MariaDB
      const revoked = await tokenAdapter.revokeToken(token);

      if (revoked) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Sesión cerrada exitosamente' }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No se pudo revocar el token' }));
      }
    } catch (error) {
      console.error('Error en logout:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error interno del servidor' }));
    }
  }
};

module.exports = authController;