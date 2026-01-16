const {
  APIServer,
  Authenticator,
  RouteLoader,
  Logger,
  TokenManager
} = require('../../index.js');

async function startServer() {
  // Crear instancia del servidor
  const server = new APIServer({
    port: 8093,
    host: 'localhost'
  });

  // Crear instancia del logger
  const logger = new Logger({ level: 'info' });

  try {
    // Crear instancia del TokenManager
    const tokenManager = new TokenManager({
      storage: 'memory'
    });

    // Crear instancia del autenticador
    const authenticator = new Authenticator({ logger });

    // Registrar estrategia de autenticación OAuth2 REAL del framework
    // Esta es la verdadera implementación del framework
    authenticator.use('oauth2', authenticator.oauth2Strategy({
      clientId: process.env.OAUTH_CLIENT_ID || 'tu-client-id-aqui',
      clientSecret: process.env.OAUTH_CLIENT_SECRET || 'tu-client-secret-aqui',
      callbackURL: 'http://localhost:8093/auth/callback',
      authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenURL: 'https://oauth2.googleapis.com/token'
    }));

    // Registrar estrategia JWT para tokens generados internamente
    authenticator.use('jwt-oauth', async (req, options = {}) => {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return false;
      }

      // Validar el token usando el secreto de las variables de entorno
      const secret = process.env.JWT_SECRET;

      // Verificar que el secreto esté definido
      if (!secret) {
        logger.error('JWT_SECRET no está definido en las variables de entorno');
        return false;
      }

      const decoded = tokenManager.validateToken(token, secret);

      if (decoded) {
        req.user = decoded;
        return true;
      }

      return false;
    });

    // Agregar el autenticador al servidor para que pueda ser usado por el RouteLoader
    server.authenticator = authenticator;

    // Cargar rutas desde archivo JSON
    const routeLoader = new RouteLoader();
    await routeLoader.loadRoutes(server, './routes.json');

    // Iniciar el servidor
    server.start();

    logger.info('Servidor iniciado en http://localhost:8093');
    logger.info('Configura tus credenciales OAuth para usar la autenticación real');
    logger.info('Variables de entorno necesarias:');
    logger.info('- OAUTH_CLIENT_ID: Tu Client ID de Google OAuth');
    logger.info('- OAUTH_CLIENT_SECRET: Tu Client Secret de Google OAuth');
  } catch (error) {
    logger.error('Error iniciando el servidor:', error.message);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

module.exports = { startServer };