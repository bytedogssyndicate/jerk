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
    port: 8091,
    host: 'localhost'
  });

  // Crear instancia del logger
  const logger = new Logger({ level: 'info' });

  try {
    // Crear instancia del TokenManager con almacenamiento en JSON
    const tokenManager = new TokenManager({
      storage: 'json',
      tokenFile: './tokens.json'
    });

    // Crear instancia del autenticador
    const authenticator = new Authenticator({ logger });

    // Registrar estrategia de autenticación JWT que utiliza el TokenManager con almacenamiento JSON
    authenticator.use('jwt-json', async (req, options = {}) => {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return false;
      }

      // Validar el token usando el TokenManager
      const secret = 'super-secret-key-for-json-example';
      const decoded = tokenManager.validateToken(token, secret);
      
      if (decoded) {
        // Verificar si el token está almacenado en el archivo JSON (opcional, dependiendo del enfoque)
        // En este caso, simplemente verificamos que el token sea válido
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

    logger.info('Servidor iniciado en http://localhost:8091');
  } catch (error) {
    logger.error('Error iniciando el servidor:', error.message);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

module.exports = { startServer };