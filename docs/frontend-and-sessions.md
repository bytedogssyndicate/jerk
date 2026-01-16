# Frontend y Sesiones con API SDK JS

## Introducción

API SDK JS no solo es un framework para crear APIs, sino que ahora también soporta la creación de aplicaciones web completas con frontend y sistema de sesiones. Esta funcionalidad permite a los desarrolladores crear aplicaciones web completas con autenticación basada en sesiones, almacenamiento de datos y mucho más.

## Características del Frontend

### Especificación de Content-Type en routes.json

Una de las nuevas características es la capacidad de especificar el content-type directamente en el archivo routes.json:

```json
[
  {
    "path": "/",
    "method": "GET",
    "controller": "./controllers/pageController.js",
    "handler": "homePage",
    "auth": "none",
    "contentType": "text/html"
  },
  {
    "path": "/api/data",
    "method": "GET",
    "controller": "./controllers/apiController.js",
    "handler": "getData",
    "auth": "none",
    "contentType": "application/json"
  }
]
```

### Soporte para diferentes tipos de contenido

El framework ahora puede servir diferentes tipos de contenido:
- HTML para páginas web
- CSS para estilos
- JavaScript para scripts
- JSON para APIs
- Y cualquier otro tipo de contenido

## Sistema de Sesiones

### Configuración

Para usar el sistema de sesiones, primero debes configurar el middleware en tu aplicación:

```javascript
const { APIServer, SessionManager, Cors } = require('jerkjs');

async function startServer() {
  const server = new APIServer({
    port: 3000,
    host: 'localhost'
  });

  // Crear instancia del administrador de sesiones
  const sessionManager = new SessionManager({
    cookieName: 'myapp_session',
    secret: 'my-super-secret-session-key',
    timeout: 3600000 // 1 hora
  });

  // Aplicar middleware de sesión
  server.use(sessionManager.middleware());

  // Hacer que sessionManager esté disponible para el RouteLoader
  server.sessionManager = sessionManager;

  // Cargar rutas
  const routeLoader = new RouteLoader();
  await routeLoader.loadRoutes(server, './routes.json');

  server.start();
}
```

### Protección de rutas

Puedes proteger rutas específicas usando `"auth": "session"` en tu archivo routes.json:

```json
[
  {
    "path": "/dashboard",
    "method": "GET",
    "controller": "./controllers/dashboardController.js",
    "handler": "showDashboard",
    "auth": "session",
    "contentType": "text/html"
  }
]
```

### Uso en controladores

En tus controladores, puedes acceder a la sesión a través de `req.session`:

```javascript
const authController = {
  // Controlador para iniciar sesión
  processLogin: async (req, res) => {
    const { username, password } = req.body;
    
    // Validar credenciales (tu lógica aquí)
    const user = await validateUser(username, password);
    
    if (user) {
      // Crear sesión de usuario autenticado
      req.session.create({
        authenticated: true,
        userId: user.id,
        username: user.username
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Inicio de sesión exitoso'
      }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Credenciales inválidas'
      }));
    }
  },

  // Controlador para cerrar sesión
  processLogout: (req, res) => {
    if (req.session) {
      req.session.destroy();
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Sesión cerrada exitosamente'
    }));
  }
};
```

## Sistema de Hooks, Filters y Actions

El sistema de sesiones está completamente integrado con el sistema de hooks, filters y actions del framework, lo que permite extender y personalizar su comportamiento.

### Hooks Disponibles

#### Sesion Creation Hooks
- `session_create_data`: Filtra los datos antes de crear una sesión
- `session_created`: Acción disparada después de crear una sesión
- `session_create_user_data`: Filtra los datos de usuario antes de crear la sesión

#### Sesion Retrieval Hooks
- `session_get_id`: Filtra el ID de sesión antes de buscarla
- `session_retrieved`: Acción disparada después de obtener una sesión
- `session_not_found`: Acción disparada cuando no se encuentra una sesión
- `session_expired`: Acción disparada cuando una sesión ha expirado

#### Sesion Update Hooks
- `session_update_data`: Filtra los nuevos datos antes de actualizar la sesión
- `session_updated`: Acción disparada después de actualizar una sesión
- `session_update_user_data`: Filtra los datos de usuario antes de actualizar

#### Sesion Destruction Hooks
- `session_destroy_before`: Acción disparada antes de destruir una sesión
- `session_destroyed`: Acción disparada después de destruir una sesión
- `session_destroy_failed`: Acción disparada cuando falla la destrucción

#### Middleware Hooks
- `session_middleware_before`: Acción disparada antes del middleware de sesión
- `session_middleware_after`: Acción disparada después del middleware de sesión

#### Authentication Hooks
- `session_auth_check_before`: Acción disparada antes de verificar autenticación
- `session_auth_success`: Acción disparada cuando la autenticación es exitosa
- `session_auth_failed`: Acción disparada cuando la autenticación falla
- `session_created_response`: Acción disparada después de crear sesión en respuesta
- `session_updated_response`: Acción disparada después de actualizar sesión en respuesta
- `session_destroyed_response`: Acción disparada después de destruir sesión en respuesta

### Ejemplos de Uso de Hooks

#### Registrar actividad de sesión

```javascript
const { hooks } = require('jerkjs');

// Registrar cuando se crea una sesión
hooks.addAction('session_created', (sessionId, sessionData) => {
  console.log(`Sesión creada: ${sessionId} para el usuario: ${sessionData.username}`);
});

// Registrar cuando se destruye una sesión
hooks.addAction('session_destroyed', (sessionId, sessionData) => {
  console.log(`Sesión destruida: ${sessionId} para el usuario: ${sessionData.username}`);
});
```

#### Modificar datos de sesión antes de crearla

```javascript
const { hooks } = require('jerkjs');

// Añadir información de IP y fecha a los datos de sesión
hooks.addFilter('session_create_data', (userData, req) => {
  return {
    ...userData,
    ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    createdAt: new Date().toISOString()
  };
});
```

#### Personalizar el manejo de autenticación fallida

```javascript
const { hooks } = require('jerkjs');

// Registrar intentos de acceso no autorizado
hooks.addAction('session_auth_failed', (req, res, redirectTo) => {
  console.log(`Intento de acceso no autorizado a: ${req.url} desde IP: ${req.connection.remoteAddress}`);
  
  // Puedes personalizar la respuesta aquí
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No autorizado', code: 'AUTH_REQUIRED' }));
  }
});
```

#### Extender datos de sesión durante la actualización

```javascript
const { hooks } = require('jerkjs');

// Añadir marca de tiempo a cada actualización de sesión
hooks.addFilter('session_update_data', (newData, req, sessionId) => {
  return {
    ...newData,
    lastUpdated: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };
});
```

## Ejemplo Completo

Aquí tienes un ejemplo completo de una aplicación que combina frontend y sesiones:

### app.js
```javascript
const {
  APIServer,
  RouteLoader,
  Logger,
  Cors,
  SessionManager
} = require('jerkjs');

async function startServer() {
  const server = new APIServer({
    port: 3000,
    host: 'localhost'
  });

  const logger = new Logger({ level: 'info' });

  try {
    // Configurar sesiones
    const sessionManager = new SessionManager({
      cookieName: 'myapp_session',
      secret: 'my-super-secret-session-key',
      timeout: 3600000
    });

    server.use(sessionManager.middleware());
    server.sessionManager = sessionManager;

    // Configurar CORS
    const cors = new Cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    });

    server.use(cors.middleware());

    // Cargar rutas
    const routeLoader = new RouteLoader();
    await routeLoader.loadRoutes(server, './routes.json');

    server.start();
    logger.info('Servidor iniciado en http://localhost:3000');
  } catch (error) {
    logger.error('Error iniciando el servidor:', error.message);
    process.exit(1);
  }
}

startServer();
```

### routes.json
```json
[
  {
    "path": "/",
    "method": "GET",
    "controller": "./controllers/pageController.js",
    "handler": "homePage",
    "auth": "none",
    "contentType": "text/html"
  },
  {
    "path": "/login",
    "method": "GET",
    "controller": "./controllers/authController.js",
    "handler": "showLoginPage",
    "auth": "none",
    "contentType": "text/html"
  },
  {
    "path": "/dashboard",
    "method": "GET",
    "controller": "./controllers/dashboardController.js",
    "handler": "showDashboard",
    "auth": "session",
    "contentType": "text/html"
  },
  {
    "path": "/api/login",
    "method": "POST",
    "controller": "./controllers/authController.js",
    "handler": "processLogin",
    "auth": "none",
    "contentType": "application/json"
  },
  {
    "path": "/api/logout",
    "method": "POST",
    "controller": "./controllers/authController.js",
    "handler": "processLogout",
    "auth": "session",
    "contentType": "application/json"
  }
]
```

Este ejemplo demuestra cómo crear una aplicación web completa con autenticación basada en sesiones, protección de rutas y soporte para frontend HTML.