/**
 * Ejemplo de página de bienvenida usando el motor de plantillas MVC de JERK
 * Demostración del sistema MVC con vistas y controladores
 */

const { APIServer, Router, Logger } = require('../../index');
const WelcomeController = require('./controllers/welcomeController');

async function startServer() {
  // Crear instancia del servidor
  const server = new APIServer({
    port: 9002,
    host: 'localhost'
  });

  // Crear instancia del logger
  const logger = new Logger({ level: 'info' });

  // Crear instancia del controlador
  const welcomeController = new WelcomeController({ 
    viewsPath: './examples/mvc_welcome/views' 
  });

  // Definir rutas
  const router = new Router();

  router
    .get('/', (req, res) => {
      welcomeController.setRequestResponse(req, res);
      welcomeController.index(req, res);
    });

  // Agregar las rutas del router al servidor
  const routes = router.getRoutes();
  for (const route of routes) {
    server.addRoute(route.method, route.path, route.handler);
  }

  // Iniciar el servidor
  server.start(() => {
    logger.info('Servidor de bienvenida MVC iniciado en http://localhost:9002');
    logger.info('Ruta disponible:');
    logger.info('- http://localhost:9002/ (Página de bienvenida)');
  });
}

// Iniciar el servidor
startServer();

module.exports = { startServer };