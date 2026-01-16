const {
  APIServer,
  RouteLoader,
  Logger,
  Cors,
  SessionManager
} = require('../../index.js');

async function startServer() {
  // Crear instancia del servidor
  const server = new APIServer({
    port: 8082,
    host: 'localhost'
  });

  // Crear instancia del logger
  const logger = new Logger({ level: 'info' });

  try {
    // Crear instancia del administrador de sesiones
    const sessionManager = new SessionManager({
      cookieName: 'frontend_session',
      secret: 'frontend-session-secret-change-in-production',
      timeout: 3600000 // 1 hora
    });

    // Aplicar middleware de sesión
    server.use(sessionManager.middleware());

    // Hacer que sessionManager esté disponible en el servidor para el RouteLoader
    server.sessionManager = sessionManager;

    // Configurar CORS para permitir solicitudes desde navegadores
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

    // Cargar rutas desde archivo JSON
    const routeLoader = new RouteLoader();
    await routeLoader.loadRoutes(server, './routes.json');

    // Iniciar el servidor
    server.start();

    logger.info('Servidor frontend iniciado en http://localhost:8082');
    logger.info('Endpoints disponibles:');
    logger.info('- GET / (Página de inicio HTML)');
    logger.info('- GET /about (Página Acerca de HTML)');
    logger.info('- GET /api/users (API JSON)');
    logger.info('- GET /contact (Formulario de contacto HTML)');
  } catch (error) {
    logger.error('Error iniciando el servidor:', error.message);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

module.exports = { startServer };