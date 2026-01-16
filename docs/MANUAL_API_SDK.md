# Manual para Construir APIs con el Framework API SDK

## Índice
1. [Introducción](#introducción)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [Conceptos Fundamentales](#conceptos-fundamentales)
4. [Creación de tu Primera API](#creación-de-tu-primera-api)
5. [Enrutamiento Avanzado](#enrutamiento-avanzado)
6. [Middleware y Seguridad](#middleware-y-seguridad)
7. [Gestión de Tokens](#gestión-de-tokens)
8. [Documentación Automática](#documentación-automática)
9. [Carga de Controladores y Rutas](#carga-de-controladores-y-rutas)
10. [Mejores Prácticas](#mejores-prácticas)

## Introducción

El Framework API SDK es una solución completa para construir APIs RESTful con características avanzadas de seguridad, rendimiento y mantenibilidad. Proporciona una arquitectura modular que facilita la creación de servicios web robustos y escalables.

## Instalación y Configuración

Para comenzar a usar el framework, primero debes instalarlo como dependencia:

```javascript
const {
  APIServer,
  Router,
  Authenticator,
  Validator,
  Cors,
  RateLimiter,
  Logger,
  TokenManager,
  OpenApiGenerator
} = require('@apisdkjs');
```

## Conceptos Fundamentales

### Componentes Principales

- **APIServer**: El servidor HTTP central que maneja todas las solicitudes
- **Router**: Sistema de enrutamiento para definir endpoints
- **Authenticator**: Sistema de autenticación con múltiples estrategias
- **Validator**: Validación de datos de entrada
- **Middleware**: Componentes que procesan solicitudes/responses

### Flujo de Trabajo Básico

1. Crear una instancia del servidor
2. Definir rutas y handlers
3. Aplicar middleware según sea necesario
4. Iniciar el servidor

## Creación de tu Primera API

### Servidor Básico

```javascript
const { APIServer, Router, Logger } = require('@apisdkjs');

// Crear instancia del servidor
const server = new APIServer({
  port: 3000,
  host: 'localhost'
});

// Crear instancia del router
const router = new Router();

// Definir rutas
router.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: '¡Hola Mundo!' }));
});

router.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ id: userId, name: 'Usuario Ejemplo' }));
});

// Agregar rutas al servidor
for (const route of router.getRoutes()) {
  server.addRoute(route.method, route.path, route.handler);
}

// Iniciar el servidor
server.start();
```

### Controladores

Los controladores son funciones que manejan la lógica de negocio para cada endpoint:

```javascript
// controllers/userController.js
const userController = {
  // GET /users
  getAllUsers: (req, res) => {
    const users = [
      { id: 1, name: 'Juan', email: 'juan@example.com' },
      { id: 2, name: 'María', email: 'maria@example.com' }
    ];
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users));
  },

  // GET /users/:id
  getUserById: (req, res) => {
    const userId = parseInt(req.params.id);
    const user = { id: userId, name: 'Usuario Ejemplo', email: 'user@example.com' };
    
    if (!user) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Usuario no encontrado' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(user));
  },

  // POST /users
  createUser: (req, res) => {
    const userData = req.body;
    const newUser = {
      id: Date.now(),
      ...userData
    };
    
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(newUser));
  }
};

module.exports = userController;
```

## Enrutamiento Avanzado

### Rutas Parametrizadas

El framework soporta rutas con parámetros:

```javascript
const router = new Router();

// Ruta con un parámetro
router.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  // Procesar solicitud
});

// Ruta con múltiples parámetros
router.get('/users/:userId/posts/:postId', (req, res) => {
  const { userId, postId } = req.params;
  // Procesar solicitud
});
```

### Rutas Anidadas

Puedes combinar routers para organizar mejor tu API:

```javascript
const mainRouter = new Router();
const userRouter = new Router({ prefix: '/users' });
const postRouter = new Router({ prefix: '/posts' });

// Definir rutas para usuarios
userRouter.get('/', (req, res) => {
  // Obtener todos los usuarios
});
userRouter.get('/:id', (req, res) => {
  // Obtener usuario por ID
});

// Definir rutas para posts
postRouter.get('/', (req, res) => {
  // Obtener todos los posts
});
postRouter.get('/:id', (req, res) => {
  // Obtener post por ID
});

// Agregar routers anidados al router principal
mainRouter.addNestedRouter('/api/v1', userRouter);
mainRouter.addNestedRouter('/api/v1', postRouter);
```

## Middleware y Seguridad

### CORS

Configura CORS para permitir solicitudes cross-origin:

```javascript
const cors = new Cors({
  origin: ['http://localhost:3000', 'https://myapp.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
});

server.use(cors.middleware());
```

### Rate Limiting

Protege tu API contra abusos con limitación de tasa:

```javascript
const rateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100 // Límite de 100 solicitudes por ventana
});

// Aplicar a todo el servidor
server.use(rateLimiter.middleware());

// O aplicar a rutas específicas
router.post('/login', rateLimiter.middleware(), (req, res) => {
  // Lógica de login
});
```

### Autenticación

El framework soporta múltiples estrategias de autenticación:

```javascript
const authenticator = new Authenticator();

// Estrategia JWT
const jwtStrategy = authenticator.jwtStrategy('tu_secreto_jwt');
authenticator.use('jwt', jwtStrategy);

// Estrategia API Key
const apiKeyStrategy = authenticator.apiKeyStrategy('X-API-Key', ['clave1', 'clave2']);
authenticator.use('apiKey', apiKeyStrategy);

// Aplicar autenticación a rutas
router.get('/protected', authenticator.authenticate('jwt'), (req, res) => {
  // Ruta protegida - req.user contendrá la información del usuario
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Contenido protegido', user: req.user }));
});
```

### Validación

Valida los datos de entrada de tus endpoints:

```javascript
const validator = new Validator();

const userValidationSchema = {
  body: {
    name: ['required', 'string', 'minLength:2'],
    email: ['required', 'email'],
    age: ['required', 'number', 'min:18', 'max:120']
  }
};

router.post('/users', 
  validator.validate(userValidationSchema), 
  (req, res) => {
    // Si llega aquí, la validación pasó
    const userData = req.body;
    // Procesar solicitud
  }
);
```

## Gestión de Tokens

### TokenManager

El framework incluye un sistema completo de gestión de tokens:

```javascript
const tokenManager = new TokenManager({
  storage: 'memory' // Opciones: 'memory', 'json', 'database'
});

// Generar un token
const payload = { userId: 123, role: 'admin' };
const token = tokenManager.generateToken(payload, 'tu_secreto', '1h');

// Validar un token
const decoded = tokenManager.validateToken(token, 'tu_secreto');
if (decoded) {
  console.log('Token válido:', decoded);
} else {
  console.log('Token inválido');
}

// Generar par de tokens (access y refresh)
const tokenPair = tokenManager.generateTokenPair(
  { userId: 123, role: 'admin' },
  {
    jwtSecret: 'access_secret',
    refreshSecret: 'refresh_secret',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d'
  }
);
```

### Adaptadores de Base de Datos

Para almacenamiento persistente de tokens, puedes usar adaptadores:

```javascript
const MariaDBTokenAdapter = require('@apisdkjs/lib/utils/mariadbTokenAdapter');
const SQLiteTokenAdapter = require('@apisdkjs/lib/utils/sqliteTokenAdapter');

// Usar MariaDB
const dbAdapter = new MariaDBTokenAdapter({
  host: 'localhost',
  user: 'usuario',
  password: 'contraseña',
  database: 'mi_bd'
});

await dbAdapter.initialize();

// Guardar token en base de datos
await dbAdapter.saveToken(token, { userId: 123 }, 'access', new Date(Date.now() + 3600000));
```

## Documentación Automática

### OpenAPI Generator

Genera documentación OpenAPI automáticamente:

```javascript
const openApiGenerator = new OpenApiGenerator({
  title: 'Mi API',
  description: 'Documentación para Mi API',
  version: '1.0.0'
});

// Agregar rutas a la documentación
openApiGenerator.addRoute({
  path: '/users',
  method: 'GET',
  config: {
    summary: 'Obtener todos los usuarios',
    description: 'Devuelve una lista de todos los usuarios registrados',
    responses: {
      '200': {
        description: 'Lista de usuarios',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  email: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }
});

// Agregar ruta de documentación al servidor
openApiGenerator.addDocumentationRoute(server);
```

## Carga de Controladores y Rutas

### Carga Dinámica de Controladores

Carga controladores desde archivos:

```javascript
const { ControllerLoader } = require('@apisdkjs');

const controllerLoader = new ControllerLoader();

// Cargar un controlador específico
const userController = controllerLoader.loadController('./controllers/userController.js');

// Cargar todos los controladores de un directorio
const controllers = controllerLoader.loadControllersFromDirectory('./controllers');

// Obtener un handler específico de un controlador
const getUserHandler = controllerLoader.getHandlerFromController(
  './controllers/userController.js', 
  'getUserById'
);
```

### Carga de Rutas desde JSON

Define rutas en archivos JSON y cárgalas dinámicamente:

```javascript
// routes.json
[
  {
    "path": "/users",
    "method": "GET",
    "controller": "./controllers/userController.js",
    "handler": "getAllUsers",
    "auth": "jwt"
  },
  {
    "path": "/users/:id",
    "method": "GET",
    "controller": "./controllers/userController.js",
    "handler": "getUserById",
    "auth": "jwt"
  },
  {
    "path": "/users",
    "method": "POST",
    "controller": "./controllers/userController.js",
    "handler": "createUser",
    "auth": "apiKey"
  }
]
```

```javascript
const { RouteLoader } = require('@apisdkjs');

const routeLoader = new RouteLoader();
const server = new APIServer({ port: 3000 });

// Cargar rutas desde archivo JSON
await routeLoader.loadRoutes(server, './routes.json');
```

## Mejores Prácticas

### Organización del Código

```
proyecto/
├── controllers/
│   ├── userController.js
│   └── postController.js
├── middleware/
│   └── customMiddleware.js
├── routes/
│   └── routes.json
├── utils/
│   └── helpers.js
├── config/
│   └── config.json
└── app.js
```

### Manejo de Errores

Implementa un middleware de manejo de errores global:

```javascript
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  }));
};

server.use(errorHandler);
```

### Logging

Utiliza el sistema de logging del framework:

```javascript
const logger = new Logger({ level: 'info' });

// En tus handlers
router.get('/users/:id', (req, res) => {
  logger.info(`Solicitud recibida para usuario ID: ${req.params.id}`);
  
  // Lógica del handler
  logger.info(`Usuario ${req.params.id} recuperado exitosamente`);
});
```

### Configuración

Usa el ConfigParser para manejar configuraciones:

```javascript
const { ConfigParser } = require('@apisdkjs');

const configParser = new ConfigParser();

// Cargar desde archivo
configParser.loadFromFile('./config.json');

// Cargar desde variables de entorno
configParser.loadFromEnv(process.env, {
  'dbHost': 'DB_HOST',
  'dbPort': 'DB_PORT',
  'jwtSecret': 'JWT_SECRET'
});

// Obtener valores de configuración
const dbHost = configParser.get('dbHost', 'localhost');
const jwtSecret = configParser.get('jwtSecret');
```

### Seguridad Adicional

Considera implementar auditoría de seguridad:

```javascript
const auditLogger = new AuditLogger({
  logFile: './security-audit.log',
  events: ['request', 'response', 'error'],
  includeHeaders: true
});

server.use(auditLogger.middleware());
```

Este manual proporciona una guía completa para construir APIs robustas y seguras con el Framework API SDK. Recuerda siempre seguir las mejores prácticas de seguridad y mantener tu código actualizado.