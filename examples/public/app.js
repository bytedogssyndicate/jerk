const {
  APIServer,
  Router,
  RouteLoader,
  Logger,
  Cors,
  RateLimiter
} = require('../../index.js');

async function startServer() {
  // Crear instancia del servidor
  const server = new APIServer({
    port: 8081,
    host: 'localhost',
    requestTimeout: 30000, // 30 segundos
    connectionTimeout: 30000 // 30 segundos
  });

  // Crear instancia del logger
  const logger = new Logger({ level: 'info' });

  try {
    // Configurar CORS para permitir solicitudes desde cualquier origen
    const cors = new Cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
      ]
    });

    // Aplicar middleware de CORS
    server.use(cors.middleware());

    // Configurar Rate Limiter para prevenir abusos
    const rateLimiter = new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 100 // Límite de 100 solicitudes por ventana
    });

    // Aplicar middleware de rate limiting
    server.use(rateLimiter.middleware());

    // Cargar rutas desde archivo JSON
    const routeLoader = new RouteLoader();
    await routeLoader.loadRoutes(server, './routes.json');

    // Iniciar el servidor
    server.start();

    logger.info('Servidor público iniciado en http://localhost:8081');
    logger.info('Endpoints disponibles:');
    logger.info('- GET / (Información del API)');
    logger.info('- GET /users (Lista de usuarios)');
    logger.info('- GET /users/:id (Obtener usuario específico)');
    logger.info('- POST /users (Crear nuevo usuario)');
    logger.info('- PUT /users/:id (Actualizar usuario)');
    logger.info('- DELETE /users/:id (Eliminar usuario)');
  } catch (error) {
    logger.error('Error iniciando el servidor:', error.message);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

module.exports = { startServer };