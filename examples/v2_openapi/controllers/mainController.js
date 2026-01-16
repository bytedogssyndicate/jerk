const jwt = require('jsonwebtoken');
const { TokenManager } = require('../../../index.js');

// TokenManager para este controlador
const tokenManager = new TokenManager({
  storage: 'memory'
});

const mainController = {
  home: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Bienvenido a la API de ejemplo con funcionalidad OpenAPI',
      endpoints: {
        'POST /login': 'Iniciar sesión y obtener token',
        'GET /users': 'Obtener lista de usuarios (requiere token)',
        'GET /products': 'Obtener lista de productos (requiere token)',
        'GET /profile': 'Obtener perfil de usuario (requiere token)',
        'GET /docs': 'Documentación interactiva OpenAPI/Swagger',
        'GET /openapi.json': 'Especificación OpenAPI'
      }
    }));
  }
};

module.exports = mainController;