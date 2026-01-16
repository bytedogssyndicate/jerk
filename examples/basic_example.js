/**
 * Ejemplo basico de uso del framework JERK
 * Este script demuestra cómo usar directamente los controladores
 */

const { JERK, Logger } = require('../index');
const userController = require('./basic/controllers/userController');

// Crear instancia del logger
const logger = new Logger({ level: 'info', timestamp: true });

logger.info('Iniciando ejemplo basico con controladores');

// Crear instancia del servidor
const server = new JERK({
  port: 6001,
  host: 'localhost'
});

// Middleware de logging
server.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Usar los handlers directamente desde el controlador
server.addRoute('GET', '/api/users', userController.getUsers);
server.addRoute('GET', '/api/users/:id', userController.getUserById);
server.addRoute('POST', '/api/users', userController.createUser);

logger.info('Agregando rutas usando handlers del controlador userController');

logger.info('\nIniciando servidor en http://localhost:6001');

// Iniciar el servidor
const httpServer = server.start();

logger.info('\nENDPOINTS DISPONIBLES:');
logger.info('GET    /api/users     - Obtener todos los usuarios');
logger.info('GET    /api/users/:id - Obtener usuario por ID');
logger.info('POST   /api/users     - Crear nuevo usuario');

logger.info('\nEJEMPLOS DE USO:');
logger.info('# Obtener todos los usuarios:');
logger.info('curl -X GET http://localhost:6001/api/users');
logger.info('');
logger.info('# Obtener usuario por ID:');
logger.info('curl -X GET http://localhost:6001/api/users/1');
logger.info('');
logger.info('# Crear nuevo usuario:');
logger.info('curl -X POST -H "Content-Type: application/json" \\');
logger.info('     -d \'{"name":"Juan Perez", "email":"juan@example.com"}\' \\');
logger.info('     http://localhost:6001/api/users');

logger.info('\nEl servidor se detendrá automáticamente en 60 segundos...');

// Programar apagado automático para la demostración
setTimeout(() => {
  logger.info('Finalizando ejemplo basico...');
  httpServer.close(() => {
    logger.info('Servidor detenido. Ejemplo basico completado.');
    console.log('\nEjemplo basico completado exitosamente!');
    console.log('El framework JERK ha demostrado su capacidad para:');
    console.log('  - Usar controladores directamente');
    console.log('  - Manejar rutas parametrizadas');
    console.log('  - Procesar solicitudes POST con cuerpo JSON');
    process.exit(0);
  });
}, 60000);

// Mantener el proceso activo
process.stdin.resume();