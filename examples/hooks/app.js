/**
 * Aplicación de ejemplo usando el framework JERK
 * Demostrando routes.json, controladores y sistema de hooks
 */

const jerk = require('jerkjs');
const {
  APIServer,
  Logger,
  RouteLoader,
  hooks
} = jerk;

// Crear instancia del logger
const logger = new Logger({ level: 'info' });

// Array para almacenar los controladores disponibles
let availableControllers = [];

// Hook que se ejecuta cuando se carga un controlador
hooks.addAction('post_controller_load', (controllerModule, absolutePath) => {
  logger.info(`[[HOOK]] - Controlador cargado: ${absolutePath}`);

  // Extraer información sobre las funciones disponibles en el controlador
  const controllerName = absolutePath.split('/').pop().replace('.js', '');

  // Verificar si es un objeto con métodos o una instancia
  let handlerNames = [];
  if (typeof controllerModule === 'object') {
    // Si es un objeto (como una instancia de ControllerBase), obtener sus métodos
    handlerNames = Object.getOwnPropertyNames(Object.getPrototypeOf(controllerModule))
      .filter(prop => typeof controllerModule[prop] === 'function' && prop !== 'constructor');
  } else if (typeof controllerModule === 'function') {
    // Si es una clase, instanciarla y obtener sus métodos
    const instance = new controllerModule();
    handlerNames = Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
      .filter(prop => typeof instance[prop] === 'function' && prop !== 'constructor');
  } else {
    // Si es un objeto con funciones directamente
    handlerNames = Object.keys(controllerModule).filter(key =>
      typeof controllerModule[key] === 'function'
    );
  }

  // Almacenar información sobre el controlador
  availableControllers.push({
    name: controllerName,
    path: absolutePath,
    handlers: handlerNames
  });

  logger.info(`[[HOOK]] - Handlers disponibles en ${controllerName}:`, handlerNames);
});

// Hook que se ejecuta antes de cargar rutas
hooks.addAction('pre_route_load', (filePath, serverInstance) => {
  logger.info(`[[HOOK]] - A punto de cargar rutas desde: ${filePath}`);
});

// Hook que se ejecuta después de cargar rutas
hooks.addAction('post_route_load', (routes, serverInstance) => {
  logger.info(`[[HOOK]] - Rutas cargadas exitosamente: ${routes.length} rutas`);
  routes.forEach((route, index) => {
    logger.info(`[[HOOK]] - Ruta ${index + 1}: ${route.method} ${route.path} -> ${route.handlerName || 'anonymous'}`);
  });
});

// Hook para registrar accesos al servidor
hooks.addAction('request_received', (req, res) => {
  logger.info(`[[ACCESS]] - Nuevo acceso recibido: ${req.method} ${req.url} desde ${req.connection.remoteAddress || 'unknown'}`);
});

// Hook para registrar descargas o finalización de solicitudes
hooks.addAction('request_completed', (req, res) => {
  logger.info(`[[DOWNLOAD/COMPLETED]] - Solicitud completada: ${req.method} ${req.url}`);
});

async function startServer() {
  // Crear instancia del servidor
  const server = new APIServer({
    port: 11000,
    host: 'localhost'
  });

  try {
    // Middleware para capturar inicio de solicitudes
    server.use((req, res, next) => {
      // Disparar hook de solicitud recibida
      hooks.doAction('request_received', req, res);

      // Guardar la función original de res.end
      const originalEnd = res.end;

      // Sobrescribir res.end para capturar cuando se completa la solicitud
      res.end = function(chunk, encoding, callback) {
        // Llamar a la función original
        const result = originalEnd.call(this, chunk, encoding, callback);

        // Disparar hook de solicitud completada
        hooks.doAction('request_completed', req, res);

        return result;
      };

      next();
    });

    // Cargar rutas desde archivo JSON
    const routeLoader = new RouteLoader();
    await routeLoader.loadRoutes(server, './routes.json');

    // Mostrar los controladores disponibles (usando hooks)
    logger.info('\n=== CONTROLADORES DISPONIBLES ===');
    availableControllers.forEach((controller, index) => {
      logger.info(`[[CONTROLLER ${index + 1}]] - Nombre: ${controller.name}`);
      logger.info(`[[PATH]] - Ruta: ${controller.path}`);
      logger.info(`[[HANDLERS]] - Funciones: ${controller.handlers.join(', ')}`);
      logger.info('---');
    });

    // Iniciar el servidor
    server.start();

    logger.info(`\nServidor iniciado en http://localhost:${server.port}`);
    logger.info('La aplicación está lista para recibir solicitudes');

  } catch (error) {
    logger.error('Error iniciando el servidor:', error.message);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

module.exports = { startServer };