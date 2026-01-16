# Manual para Implementar OAuth 2.0 con Google usando el Framework API SDK

Visita nuestra página web: https://jerk.page.gd/
Repositorio oficial: https://gitlab.com/bytedogssyndicate1/jerk/

## Índice
1. [Introducción](#introducción)
2. [Requisitos Previos](#requisitos-previos)
3. [Configuración en Google Cloud Console](#configuración-en-google-cloud-console)
4. [Configuración del Framework API SDK](#configuración-del-framework-api-sdk)
5. [Implementación del Flujo OAuth 2.0](#implementación-del-flujo-oauth-20)
6. [Manejo de Tokens](#manejo-de-tokens)
7. [Protección de Endpoints](#protección-de-endpoints)
8. [Consideraciones de Seguridad](#consideraciones-de-seguridad)
9. [Depuración y Troubleshooting](#depuración-y-troubleshooting)

## Introducción

OAuth 2.0 es un protocolo de autorización que permite a aplicaciones de terceros obtener acceso limitado a cuentas de usuario de un servicio web. En este manual, aprenderás cómo implementar OAuth 2.0 con Google usando el Framework API SDK.

## Requisitos Previos

- Cuenta de Google
- Acceso a Google Cloud Console
- Node.js instalado
- Framework API SDK instalado
- Conocimientos básicos de JavaScript y APIs REST

## Configuración en Google Cloud Console

### Paso 1: Crear un proyecto en Google Cloud Console

1. Accede a [Google Cloud Console](https://console.cloud.google.com/)
2. Haz clic en "Seleccionar un proyecto" o "Nuevo proyecto"
3. Ingresa un nombre para tu proyecto
4. Haz clic en "Crear"

### Paso 2: Habilitar Google+ API (o las APIs que necesites)

1. En el panel lateral izquierdo, haz clic en "APIs y servicios" > "Biblioteca"
2. Busca "Google+ API" o las APIs que planeas usar (como People API)
3. Haz clic en "Habilitar"

### Paso 3: Crear credenciales OAuth 2.0

1. En el panel lateral izquierdo, haz clic en "APIs y servicios" > "Credenciales"
2. Haz clic en "Crear credenciales" > "ID de cliente OAuth 2.0"
3. Si aún no has configurado el consentimiento OAuth, haz clic en "Configurar pantalla de consentimiento OAuth"
4. Completa la información de la pantalla de consentimiento:
   - Tipo de usuario: Público o Interno (según tu necesidad)
   - Ingresa un nombre de aplicación
   - Agrega direcciones de correo electrónico de desarrolladores
   - Ingresa un dominio de aplicación (si aplica)
5. Guarda la configuración de consentimiento

### Paso 4: Configurar las credenciales

1. De vuelta en la página de credenciales, haz clic en "Crear credenciales" > "ID de cliente OAuth 2.0"
2. Selecciona "Aplicación web" como tipo de aplicación
3. Ingresa un nombre para las credenciales
4. En "URI de redirección autorizados", agrega las siguientes URLs:
   - `http://localhost:8093/auth/callback` (ajusta el puerto según tu configuración)
   - `http://localhost:3000/auth/callback` (si usas otro puerto)
   - Cualquier otra URL de callback que vayas a usar
5. Haz clic en "Crear"
6. Guarda el "ID de cliente" y el "Secreto de cliente" que se mostrarán

## Configuración del Framework API SDK

### Paso 1: Instalar el Framework API SDK

```bash
npm install jerk
```

### Paso 2: Configurar variables de entorno

Crea un archivo `.env` en la raíz de tu proyecto:

```env
OAUTH_CLIENT_ID=tu_client_id_aqui
OAUTH_CLIENT_SECRET=tu_client_secret_aqui
OAUTH_CALLBACK_URL=http://localhost:8093/auth/callback
```

### Paso 3: Importar los componentes necesarios

```javascript
const {
  APIServer,
  Authenticator,
  RouteLoader,
  Logger,
  TokenManager
} = require('jerk');
```

## Implementación del Flujo OAuth 2.0

### Paso 1: Configurar el servidor y autenticador

```javascript
const server = new APIServer({
  port: 8093,
  host: 'localhost'
});

const authenticator = new Authenticator({ logger });

// Registrar la estrategia OAuth2
authenticator.use('google-oauth', authenticator.oauth2Strategy({
  clientId: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  callbackURL: process.env.OAUTH_CALLBACK_URL,
  authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenURL: 'https://oauth2.googleapis.com/token'
}));

// Agregar autenticador al servidor
server.authenticator = authenticator;
```

### Paso 2: Crear el endpoint para iniciar OAuth

```javascript
// Ruta para iniciar el flujo OAuth
router.get('/auth/google', (req, res) => {
  // El framework maneja la redirección a Google
  const authMiddleware = authenticator.authenticate('google-oauth');
  authMiddleware(req, res, () => {});
});
```

### Paso 3: Crear el endpoint de callback

```javascript
// Ruta para manejar el callback de OAuth
router.get('/auth/callback', async (req, res) => {
  try {
    // El framework maneja la autenticación y el intercambio de código por token
    const authMiddleware = authenticator.authenticate('google-oauth', {
      failureRedirect: '/login'
    });
    
    // Ejecutar middleware de autenticación
    authMiddleware(req, res, async () => {
      // Si llegamos aquí, la autenticación fue exitosa
      if (req.user) {
        // Generar token JWT para el usuario autenticado
        const token = jwt.sign({
          userId: req.user.id,
          email: req.user.email,
          name: req.user.name
        }, process.env.JWT_SECRET);
        
        // Redirigir con token o mostrar página de éxito
        res.writeHead(302, { 'Location': `/dashboard?token=${token}` });
        res.end();
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Autenticación fallida' }));
      }
    });
  } catch (error) {
    console.error('Error en callback OAuth:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Error interno del servidor' }));
  }
});
```

## Manejo de Tokens

### Paso 1: Configurar TokenManager

```javascript
const tokenManager = new TokenManager({
  storage: 'memory' // Opciones: 'memory', 'json', 'database'
});
```

### Paso 2: Generar tokens JWT

```javascript
// Generar token JWT después de autenticación exitosa
const generateToken = (userData) => {
  return jwt.sign(
    { 
      userId: userData.id,
      email: userData.email,
      name: userData.name,
      provider: 'google'
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};
```

### Paso 3: Validar tokens

```javascript
// Middleware para validar tokens JWT
const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Token no proporcionado' }));
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Token inválido' }));
      return;
    }
    
    req.user = decoded;
    next();
  });
};
```

## Protección de Endpoints

### Paso 1: Proteger rutas individuales

```javascript
// Proteger una ruta específica
router.get('/profile', validateToken, (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    user: req.user,
    message: 'Perfil de usuario protegido'
  }));
});
```

### Paso 2: Proteger rutas usando el framework

```javascript
// Usar la estrategia JWT del framework
authenticator.use('jwt-auth', (req, options = {}) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return false;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return true;
  } catch (error) {
    return false;
  }
});

// Proteger ruta con autenticación JWT
router.get('/protected', authenticator.authenticate('jwt-auth'), (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Contenido protegido', user: req.user }));
});
```

## Consideraciones de Seguridad

### 1. Almacenamiento de credenciales

- Nunca almacenes credenciales en el código fuente
- Usa variables de entorno o servicios de gestión de secretos
- Rotar periódicamente los secrets

### 2. Validación de tokens

- Siempre valida tokens antes de conceder acceso
- Implementa expiración de tokens
- Considera usar refresh tokens para largas sesiones

### 3. Configuración de Google

- Limita las URLs de redirección a solo las que necesitas
- Usa HTTPS en producción
- Monitorea el uso de tus credenciales

### 4. Manejo de errores

- No reveles información sensible en mensajes de error
- Implementa logging adecuado para auditoría
- Maneja correctamente los casos de fallo de autenticación

## Depuración y Troubleshooting

### Problemas comunes y soluciones

#### 1. Error: "redirect_uri_mismatch"
- **Causa**: La URL de redirección no coincide con las registradas en Google Cloud Console
- **Solución**: Verifica que la URL en tu código coincida exactamente con las registradas

#### 2. Error: "invalid_client"
- **Causa**: Client ID o Client Secret incorrectos
- **Solución**: Verifica que las credenciales sean correctas y no estén truncadas

#### 3. Token expirado
- **Causa**: El access token ha expirado
- **Solución**: Implementa refresh tokens o solicita nuevo acceso

### Herramientas de depuración

```javascript
// Habilitar logging detallado
const logger = new Logger({ level: 'debug' });

// Verificar estado de autenticación
console.log('Usuario autenticado:', req.user);
console.log('Headers:', req.headers);
console.log('Query params:', req.query);
```

### Pruebas

```javascript
// Prueba de endpoint protegido
const testProtectedEndpoint = async (token) => {
  const response = await fetch('http://localhost:8093/protected', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log('Respuesta del endpoint protegido:', data);
};
```

## Ejemplo Completo

Aquí tienes un ejemplo completo de implementación:

```javascript
const {
  APIServer,
  Authenticator,
  Router,
  Logger
} = require('jerk');

const jwt = require('jsonwebtoken');

async function startServer() {
  const server = new APIServer({
    port: 8093,
    host: 'localhost'
  });

  const logger = new Logger({ level: 'info' });
  const router = new Router();
  const authenticator = new Authenticator({ logger });

  // Configurar estrategia OAuth2
  authenticator.use('google-oauth', authenticator.oauth2Strategy({
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    callbackURL: process.env.OAUTH_CALLBACK_URL,
  }));

  // Agregar autenticador al servidor
  server.authenticator = authenticator;

  // Ruta para iniciar OAuth
  router.get('/auth/google', (req, res) => {
    authenticator.authenticate('google-oauth')(req, res, () => {});
  });

  // Ruta de callback
  router.get('/auth/callback', (req, res) => {
    authenticator.authenticate('google-oauth', {
      successRedirect: '/dashboard',
      failureRedirect: '/login'
    })(req, res, () => {});
  });

  // Ruta protegida
  router.get('/dashboard', (req, res) => {
    if (req.user) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Bienvenido al dashboard', user: req.user }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No autorizado' }));
    }
  });

  // Agregar rutas al servidor
  for (const route of router.getRoutes()) {
    server.addRoute(route.method, route.path, route.handler);
  }

  server.start();
  logger.info('Servidor iniciado en http://localhost:8093');
}

startServer();
```

Este manual proporciona una guía completa para implementar OAuth 2.0 con Google usando el Framework API SDK, desde la configuración inicial hasta la implementación completa y consideraciones de seguridad.