const {
  APIServer,
  Cors,
  Logger
} = require('../../index.js');

async function startServer() {
  // Crear instancia del servidor
  const server = new APIServer({
    port: 8094,
    host: 'localhost'
  });

  // Crear instancia del logger
  const logger = new Logger({ level: 'info' });

  try {
    // Crear instancia del middleware CORS
    const cors = new Cors({
      origin: ['http://localhost:3000', 'http://localhost:8080', 'https://miapp.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Accept', 
        'X-Api-Key'
      ],
      exposedHeaders: [
        'X-Total-Count',
        'X-Request-ID'
      ],
      credentials: true,
      maxAge: 86400 // 24 horas
    });

    // Aplicar el middleware CORS al servidor
    server.use(cors.middleware());

    // Agregar algunas rutas de ejemplo
    server.addRoute('GET', '/', (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'API con CORS configurado',
        endpoints: {
          'GET /public': 'Endpoint público con CORS',
          'POST /data': 'Endpoint para recibir datos con CORS',
          'GET /test-cors': 'Endpoint para probar diferentes encabezados CORS'
        }
      }));
    });

    server.addRoute('GET', '/public', (req, res) => {
      // Establecer encabezados personalizados que serán expuestos al cliente
      res.setHeader('X-Request-ID', 'req-' + Date.now());
      res.setHeader('X-Total-Count', '100');
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Este es un endpoint público con CORS habilitado',
        timestamp: new Date().toISOString(),
        origin: req.headers.origin || 'no origin'
      }));
    });

    server.addRoute('POST', '/data', (req, res) => {
      // Establecer encabezados personalizados
      res.setHeader('X-Request-ID', 'req-' + Date.now());
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Datos recibidos exitosamente',
        receivedData: req.body,
        timestamp: new Date().toISOString()
      }));
    });

    server.addRoute('GET', '/test-cors', (req, res) => {
      // Endpoint para probar diferentes aspectos de CORS
      res.setHeader('X-Request-ID', 'req-' + Date.now());
      res.setHeader('X-Custom-Header', 'custom-value'); // Este encabezado no está en exposedHeaders
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Prueba de CORS completada',
        headers: req.headers,
        timestamp: new Date().toISOString()
      }));
    });

    // Manejar solicitudes OPTIONS para todos los endpoints (preflight)
    // No es necesario agregar una ruta específica para '*' ya que el middleware CORS lo maneja

    // Iniciar el servidor
    server.start();

    logger.info('Servidor iniciado en http://localhost:8094');
    logger.info('CORS configurado para orígenes: http://localhost:3000, http://localhost:8080, https://miapp.com');
  } catch (error) {
    logger.error('Error iniciando el servidor:', error.message);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

module.exports = { startServer };