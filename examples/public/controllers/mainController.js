const mainController = {
  home: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Bienvenido a la API Pública de Ejemplo',
      version: '1.0.0',
      description: 'Esta es una API pública de ejemplo creada con el Framework JERK JS',
      endpoints: {
        'GET /': 'Este mensaje',
        'GET /users': 'Obtener lista de usuarios',
        'GET /users/:id': 'Obtener usuario específico',
        'POST /users': 'Crear nuevo usuario',
        'PUT /users/:id': 'Actualizar usuario',
        'DELETE /users/:id': 'Eliminar usuario',
        'GET /health': 'Verificar estado del servicio'
      },
      documentation: 'Visita el README para más información sobre cómo usar esta API'
    }));
  }
};

module.exports = mainController;