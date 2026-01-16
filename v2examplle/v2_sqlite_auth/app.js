const {
  APIServer,
  Authenticator,
  RouteLoader,
  Logger,
  SQLiteTokenAdapter
} = require('../../index.js');

async function startServer() {
  // Crear instancia del servidor
  const server = new APIServer({
    port: 8088,
    host: 'localhost'
  });

  // Crear instancia del logger
  const logger = new Logger({ level: 'info' });

  try {
    // Crear instancia del adaptador de tokens SQLite
    const tokenAdapter = new SQLiteTokenAdapter({
      dbPath: './tokens_example.sqlite',
      tableName: 'example_tokens'
    });

    // Inicializar el adaptador de tokens
    await tokenAdapter.initialize();
    logger.info('SQLite Token Adapter inicializado correctamente');

    // Crear instancia del autenticador
    const authenticator = new Authenticator({ logger });

    // Registrar estrategia de autenticación JWT que utiliza el adaptador SQLite
    authenticator.use('jwt-sqlite', async (req, options = {}) => {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return false;
      }

      // Validar el token contra la base de datos SQLite
      const tokenRecord = await tokenAdapter.validateToken(token);
      
      if (tokenRecord) {
        // Agregar información del usuario a la solicitud
        req.user = { userId: tokenRecord.user_id, tokenType: tokenRecord.token_type };
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

    logger.info('Servidor iniciado en http://localhost:8088');
  } catch (error) {
    logger.error('Error iniciando el servidor:', error.message);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

module.exports = { startServer };