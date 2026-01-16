const jwt = require('jsonwebtoken');
const { SQLiteTokenAdapter } = require('../../../index.js');

// Adaptador de tokens para este controlador
const tokenAdapter = new SQLiteTokenAdapter({
  dbPath: './tokens_example.sqlite',
  tableName: 'example_tokens'
});

const mainController = {
  home: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Bienvenido a la API de ejemplo con autenticación SQLite',
      endpoints: {
        'POST /login': 'Iniciar sesión y obtener token',
        'GET /protected': 'Contenido protegido (requiere token)',
        'GET /profile': 'Perfil de usuario (requiere token)'
      }
    }));
  }
};

module.exports = mainController;