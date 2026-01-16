/**
 * Ejemplo de API con funcionalidades OpenAPI (v2.1.0)
 * Demostrando la generación automática de documentación OpenAPI
 */

const {
  APIServer,
  Authenticator,
  Logger,
  OpenApiGenerator
} = require('../../index.js');

async function startServer() {
  // Crear instancia del servidor
  const server = new APIServer({
    port: 8096,
    host: 'localhost'
  });

  // Crear instancia del logger
  const logger = new Logger({ level: 'info' });

  // Crear instancia del autenticador
  const authenticator = new Authenticator({ logger });

  // Registrar estrategia de autenticación JWT
  authenticator.use('jwt-openapi', authenticator.jwtStrategy('super-secret-key-for-openapi-example'));

  try {
    // Crear instancia del generador de OpenAPI
    const openApiGenerator = new OpenApiGenerator({
      title: 'API de Ejemplo con OpenAPI',
      description: 'API que demuestra la funcionalidad OpenAPI del Framework API SDK',
      version: '2.1.0',
      servers: [
        { url: 'http://localhost:8096', description: 'Servidor de desarrollo' }
      ]
    });

    // Definir esquemas para la documentación
    openApiGenerator.addSchema('User', {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        role: { type: 'string', example: 'user' }
      },
      required: ['id', 'name', 'email']
    });

    openApiGenerator.addSchema('Product', {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Laptop' },
        price: { type: 'number', example: 999.99 },
        category: { type: 'string', example: 'Electronics' }
      },
      required: ['id', 'name', 'price']
    });

    openApiGenerator.addSchema('LoginRequest', {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'admin' },
        password: { type: 'string', example: 'password' }
      },
      required: ['username', 'password']
    });

    openApiGenerator.addSchema('LoginResponse', {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Inicio de sesión exitoso' },
        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        user: { $ref: '#/components/schemas/User' }
      }
    });

    // Agregar rutas a la documentación OpenAPI
    openApiGenerator.addRoute({
      path: '/',
      method: 'GET',
      config: {
        summary: 'Página de inicio',
        description: 'Devuelve información básica sobre la API y sus funcionalidades OpenAPI',
        responses: {
          '200': {
            description: 'Información de la API',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    features: { type: 'array', items: { type: 'string' } },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
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
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Inicio de sesión exitoso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          '401': {
            description: 'Credenciales inválidas'
          }
        }
      }
    });

    openApiGenerator.addRoute({
      path: '/users',
      method: 'GET',
      config: {
        summary: 'Obtener usuarios',
        description: 'Lista de usuarios registrados (requiere autenticación JWT)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de usuarios',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/User' }
                }
              }
            }
          }
        }
      }
    });

    openApiGenerator.addRoute({
      path: '/products',
      method: 'GET',
      config: {
        summary: 'Obtener productos',
        description: 'Lista de productos disponibles (requiere autenticación JWT)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de productos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Product' }
                }
              }
            }
          }
        }
      }
    });

    // Agregar esquema de seguridad
    openApiGenerator.addSecurityScheme('bearerAuth', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Autenticación por token JWT'
    });

    // Agregar rutas de documentación al servidor
    openApiGenerator.addDocumentationRoute(server);

    // Ruta pública
    server.addRoute('GET', '/', (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'API con funcionalidades OpenAPI (v2.1.0)',
        features: [
          'Generación automática de documentación OpenAPI 3.0',
          'Interfaz Swagger UI interactiva',
          'Esquemas de datos definidos',
          'Documentación de seguridad',
          'Especificación de endpoints, parámetros y respuestas'
        ],
        timestamp: new Date().toISOString()
      }));
    });

    // Ruta de login
    server.addRoute('POST', '/login', (req, res) => {
      let body = req.body;
      
      // Si body es string, intentar parsear como JSON
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (parseError) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Formato de solicitud inválido' }));
          return;
        }
      }
      
      const { username, password } = body;

      // Simulación de autenticación
      if (username === 'admin' && password === 'password') {
        // Generar token JWT
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
          { userId: 1, username: username, role: 'admin' },
          'super-secret-key-for-openapi-example',
          { expiresIn: '1h' }
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Inicio de sesión exitoso',
          token: token,
          user: { userId: 1, username: username, role: 'admin' }
        }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Credenciales inválidas' }));
      }
    });

    // Ruta protegida - Usuarios
    server.addRoute('GET', '/users', (req, res) => {
      authenticator.authenticate('jwt-openapi')(req, res, () => {
        if (req.user) {
          const users = [
            { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
            { id: 3, name: 'Robert Johnson', email: 'robert@example.com', role: 'user' }
          ];

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(users));
        }
      });
    });

    // Ruta protegida - Productos
    server.addRoute('GET', '/products', (req, res) => {
      authenticator.authenticate('jwt-openapi')(req, res, () => {
        if (req.user) {
          const products = [
            { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics' },
            { id: 2, name: 'Mouse', price: 29.99, category: 'Electronics' },
            { id: 3, name: 'Keyboard', price: 79.99, category: 'Electronics' }
          ];

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(products));
        }
      });
    });

    // Iniciar el servidor
    server.start();

    logger.info('Servidor OpenAPI iniciado en http://localhost:8096');
    logger.info('Documentación OpenAPI disponible en http://localhost:8096/docs');
    logger.info('Especificación OpenAPI disponible en http://localhost:8096/openapi.json');
  } catch (error) {
    logger.error('Error iniciando el servidor:', error.message);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

module.exports = { startServer };