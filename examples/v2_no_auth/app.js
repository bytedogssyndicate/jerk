const {
  APIServer,
  RouteLoader,
  Logger,
  OpenApiGenerator
} = require('../../index.js');

async function startServer() {
  // Crear instancia del servidor
  const server = new APIServer({
    port: 8089,
    host: 'localhost'
  });

  // Crear instancia del logger
  const logger = new Logger({ level: 'info' });

  try {
    // Cargar rutas desde archivo JSON
    const routeLoader = new RouteLoader();
    await routeLoader.loadRoutes(server, './routes.json');

    // Crear instancia del generador de OpenAPI
    const openApiGenerator = new OpenApiGenerator({
      title: 'API Pública de Ejemplo',
      description: 'Una API pública sin autenticación',
      version: '1.0.0'
    });

    // Agregar rutas a la documentación OpenAPI
    openApiGenerator.addRoute({
      path: '/public',
      method: 'GET',
      config: {
        summary: 'Endpoint público de ejemplo',
        description: 'Devuelve datos públicos sin requerir autenticación',
        responses: {
          '200': {
            description: 'Datos públicos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    timestamp: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Agregar ruta de documentación al servidor
    openApiGenerator.addDocumentationRoute(server);

    // Iniciar el servidor
    server.start();

    logger.info('Servidor iniciado en http://localhost:8089');
  } catch (error) {
    logger.error('Error iniciando el servidor:', error.message);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

module.exports = { startServer };