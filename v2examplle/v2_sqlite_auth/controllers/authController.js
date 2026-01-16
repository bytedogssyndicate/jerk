const jwt = require('jsonwebtoken');
const { SQLiteTokenAdapter } = require('../../../index.js');

// Adaptador de tokens para este controlador
const tokenAdapter = new SQLiteTokenAdapter({
  dbPath: './tokens_example.sqlite',
  tableName: 'example_tokens'
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
        const secret = 'super-secret-key-for-example';
        const token = jwt.sign(payload, secret, { expiresIn: '1h' });

        // Guardar el token en la base de datos SQLite
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
  }
};

module.exports = authController;