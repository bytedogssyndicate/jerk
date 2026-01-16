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

const mainController = {
  home: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Bienvenido a la API de ejemplo con autenticación MariaDB',
      endpoints: {
        'POST /login': 'Iniciar sesión y obtener token',
        'GET /protected': 'Contenido protegido (requiere token)',
        'GET /profile': 'Perfil de usuario (requiere token)',
        'POST /logout': 'Cerrar sesión y revocar token (requiere token)'
      }
    }));
  }
};

module.exports = mainController;