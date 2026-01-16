/**
 * Ejemplo real de uso del framework JERK
 * Este script demuestra cómo cargar rutas desde un archivo JSON
 * y usar los controladores definidos en el archivo de rutas
 */

const path = require('path');
const { JERK, RouteLoader, Authenticator, Logger } = require('../index');

// Crear instancia del logger
const logger = new Logger({ level: 'info', timestamp: true });

logger.info('Iniciando ejemplo real de carga de rutas desde JSON');

// Crear instancia del servidor
const server = new JERK({
  port: 6000,
  host: 'localhost'
});

// Crear instancia del autenticador
const authenticator = new Authenticator();

// Registrar estrategias de autenticación que se usan en routes.json
authenticator.use('apiKey', authenticator.apiKeyStrategy('X-API-Key', ['secret-key-123']));
authenticator.use('jwt', authenticator.jwtStrategy('secret-jwt-key'));

// Cargar rutas desde el archivo JSON
const routeLoader = new RouteLoader();

// Middleware de logging
server.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - IP: ${req.connection.remoteAddress}`);
  next();
});

logger.info('Cargando rutas desde advanced/routes.json...');

// Cargar las rutas desde el archivo JSON
// Cambiamos temporalmente el directorio de trabajo para que las rutas relativas funcionen correctamente
const originalCwd = process.cwd();
process.chdir(__dirname); // Cambiar al directorio actual (examples)

routeLoader.loadRoutes(server, './advanced/routes.json')
  .then(routes => {
    process.chdir(originalCwd); // Restaurar directorio original
    
    logger.info(`Cargadas ${routes.length} rutas desde el archivo JSON:`);
    routes.forEach((route, index) => {
      logger.info(`  ${index + 1}. ${route.method} ${route.path} -> ${route.controller}#${route.handler}`);
    });
    
    logger.info('\nIniciando servidor en http://localhost:6000');
    
    // Iniciar el servidor
    const httpServer = server.start();
    
    logger.info('\nENDPOINTS DISPONIBLES (cargados desde routes.json):');
    logger.info('GET    /api/users                    - Obtener todos los usuarios (JWT req)');
    logger.info('GET    /api/users/:id               - Obtener usuario por ID (JWT req)');
    logger.info('POST   /api/users                    - Crear usuario (API Key req)');
    logger.info('GET    /api/products                 - Obtener productos (sin auth)');
    logger.info('PUT    /api/products/:id            - Actualizar producto (API Key req)');
    
    logger.info('\nEJEMPLOS DE USO:');
    logger.info('# Obtener productos (sin autenticación):');
    logger.info('curl -X GET http://localhost:6000/api/products');
    
    logger.info('\nEl servidor se detendrá automáticamente en 120 segundos...');
    
    // Programar apagado automático para la demostración
    setTimeout(() => {
      logger.info('Finalizando ejemplo...');
      httpServer.close(() => {
        logger.info('Servidor detenido. Ejemplo completado.');
        console.log('\nEjemplo real completado exitosamente!');
        console.log('El framework JERK ha demostrado su capacidad para:');
        console.log('  - Cargar rutas dinámicamente desde archivos JSON');
        console.log('  - Usar controladores definidos externamente');
        console.log('  - Aplicar diferentes tipos de autenticación');
        process.exit(0);
      });
    }, 120000);
    
  })
  .catch(error => {
    process.chdir(originalCwd); // Asegurarse de restaurar el directorio en caso de error
    logger.error('Error cargando rutas:', error.message);
    process.exit(1);
  });

// Mantener el proceso activo
process.stdin.resume();