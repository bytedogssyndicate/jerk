/**
 * Ejemplo de uso del sistema de hooks en el Framework JERK
 * Demostrando extensibilidad en diferentes puntos del ciclo de vida
 */

const jerk = require('../../index.js');
const {
  APIServer,
  Logger
} = jerk;
const RouteLoader = require('../../lib/loader/routeLoader.js');
const ControllerLoader = require('../../lib/loader/controllerLoader.js');
const hooks = jerk.hooks;

async function startServer() {
  // Crear instancia del servidor
  const server = new APIServer({
    port: 8096,
    host: 'localhost'
  });

  // Crear instancia del logger
  const logger = new Logger({ level: 'info' });

  try {
    // Registrar hooks para diferentes eventos del ciclo de vida

    // Hook que se ejecuta cuando se inicializa el framework
    hooks.addAction('framework_init', () => {
      logger.info('[[FRAMEWORK]] - El framework ha sido inicializado');
    });

    // Hook que se ejecuta antes de iniciar el servidor
    hooks.addAction('pre_server_start', (serverInstance) => {
      logger.info('[[HOOK]] - Antes de iniciar el servidor');
      logger.info('[[HOOK]] - Puerto configurado:', serverInstance.port);
    });

    // Hook que se ejecuta después de iniciar el servidor
    hooks.addAction('post_server_start', (serverInstance) => {
      logger.info('[[HOOK]] - Servidor iniciado exitosamente');
      logger.info('[[HOOK]] - Escuchando en:', `http://${serverInstance.host}:${serverInstance.port}`);
    });

    // Hook que se ejecuta antes de cargar rutas
    hooks.addAction('pre_route_load', (filePath, serverInstance) => {
      logger.info('[[HOOK]] - A punto de cargar rutas desde:', filePath);
    });

    // Hook que se ejecuta después de cargar rutas
    hooks.addAction('post_route_load', (routes, serverInstance) => {
      logger.info('[[HOOK]] - Rutas cargadas exitosamente:', routes.length, 'rutas');
      routes.forEach((route, index) => {
        logger.info(`[[HOOK]] - Ruta ${index + 1}: ${route.method} ${route.path}`);
      });
    });

    // Hook que se ejecuta antes de cargar un controlador
    hooks.addAction('pre_controller_load', (controllerPath) => {
      logger.info('[[HOOK]] - A punto de cargar controlador:', controllerPath);
    });

    // Hook que se ejecuta después de cargar un controlador
    hooks.addAction('post_controller_load', (controllerModule, absolutePath) => {
      logger.info('[[HOOK]] - Controlador cargado exitosamente:', absolutePath);
      // Podríamos inspeccionar las funciones disponibles en el módulo
      const availableHandlers = Object.keys(controllerModule).filter(key => 
        typeof controllerModule[key] === 'function'
      );
      logger.info('[[HOOK]] - Handlers disponibles en el controlador:', availableHandlers);
    });

    // Ejemplo de uso de filtros
    hooks.addFilter('modify_response_data', (data, endpoint) => {
      // Añadir información de auditoría a todas las respuestas
      return {
        ...data,
        _hook_processed: true,
        _timestamp: new Date().toISOString(),
        _endpoint: endpoint
      };
    });

    // Cargar rutas desde archivo JSON
    const routeLoader = new RouteLoader();
    await routeLoader.loadRoutes(server, './routes.json');

    // Iniciar el servidor
    server.start();

    logger.info('Servidor iniciado con sistema de hooks activo');
  } catch (error) {
    logger.error('Error iniciando el servidor:', error.message);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

module.exports = { startServer };