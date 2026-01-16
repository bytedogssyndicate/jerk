const {
  APIServer,
  Authenticator,
  RouteLoader,
  Logger,
  OpenApiGenerator,
  TokenManager
} = require('../../index.js');

async function startServer() {
  // Crear instancia del servidor
  const server = new APIServer({
    port: 8092,
    host: 'localhost'
  });

  // Crear instancia del logger
  const logger = new Logger({ level: 'info' });

  try {
    // Crear instancia del TokenManager con almacenamiento en memoria
    const tokenManager = new TokenManager({
      storage: 'memory'
    });

    // Crear instancia del autenticador
    const authenticator = new Authenticator({ logger });

    // Registrar estrategia de autenticación JWT
    authenticator.use('jwt-openapi', async (req, options = {}) => {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return false;
      }

      // Validar el token usando un secreto fijo para este ejemplo
      const secret = 'super-secret-key-for-openapi-example';
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

    // Crear instancia del generador de OpenAPI
    const openApiGenerator = new OpenApiGenerator({
      title: 'API de Ejemplo con OpenAPI',
      description: 'Una API de ejemplo que demuestra la funcionalidad OpenAPI del Framework API SDK',
      version: '1.0.0',
      servers: [
        { url: 'http://localhost:8092', description: 'Servidor de desarrollo' }
      ]
    });

    // Agregar esquemas a la documentación
    openApiGenerator.addSchema('User', {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        role: { type: 'string', example: 'user' }
      }
    });

    openApiGenerator.addSchema('Product', {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Laptop' },
        price: { type: 'number', example: 999.99 },
        category: { type: 'string', example: 'Electronics' }
      }
    });

    openApiGenerator.addSchema('ApiResponse', {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Operación exitosa' },
        data: { type: 'object', description: 'Datos de la respuesta' }
      }
    });

    // Agregar esquema de seguridad
    openApiGenerator.addSecurityScheme('bearerAuth', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Autenticación por token JWT'
    });

    // Agregar rutas a la documentación OpenAPI
    openApiGenerator.addRoute({
      path: '/users',
      method: 'GET',
      config: {
        summary: 'Obtener todos los usuarios',
        description: 'Devuelve una lista de todos los usuarios registrados',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de usuarios',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/User'
                  }
                }
              }
            }
          },
          '401': {
            description: 'No autorizado - Token inválido o ausente'
          }
        }
      }
    });

    openApiGenerator.addRoute({
      path: '/products',
      method: 'GET',
      config: {
        summary: 'Obtener todos los productos',
        description: 'Devuelve una lista de todos los productos disponibles',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de productos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Product'
                  }
                }
              }
            }
          },
          '401': {
            description: 'No autorizado - Token inválido o ausente'
          }
        }
      }
    });

    openApiGenerator.addRoute({
      path: '/login',
      method: 'POST',
      config: {
        summary: 'Iniciar sesión',
        description: 'Autenticación de usuario y obtención de token JWT',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: 'password' }
                },
                required: ['username', 'password']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Inicio de sesión exitoso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Inicio de sesión exitoso' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Credenciales inválidas'
          }
        }
      }
    });

    // Agregar ruta de documentación al servidor
    openApiGenerator.addDocumentationRoute(server);

    // Iniciar el servidor
    server.start();

    logger.info('Servidor iniciado en http://localhost:8092');
    logger.info('Documentación OpenAPI disponible en http://localhost:8092/docs');
  } catch (error) {
    logger.error('Error iniciando el servidor:', error.message);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

module.exports = { startServer };