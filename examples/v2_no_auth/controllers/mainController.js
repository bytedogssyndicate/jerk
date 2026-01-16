const mainController = {
  home: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Bienvenido a la API pública de ejemplo',
      endpoints: {
        'GET /': 'Esta página de inicio',
        'GET /public': 'Datos públicos de ejemplo',
        'GET /products': 'Lista de productos',
        'GET /products/:id': 'Producto por ID',
        'GET /health': 'Estado del servicio',
        'GET /docs': 'Documentación interactiva de la API',
        'GET /openapi.json': 'Especificación OpenAPI'
      }
    }));
  }
};

module.exports = mainController;