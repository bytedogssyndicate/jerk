# JERK Framework v2.0

![JERK Framework Logo](jerk.jpg)

Visita nuestra página web: https://jerk.page.gd/
Repositorio oficial: https://gitlab.com/bytedogssyndicate1/jerk/

JERK Framework es un framework completo para construir APIs seguras y escalables en Node.js. Proporciona una arquitectura modular con soporte para autenticación, seguridad avanzada, enrutamiento flexible, gestión de sesiones, motor de plantillas MVC y muchas características más.

## Características

- **Arquitectura Modular**: Componentes independientes para mayor flexibilidad
- **Seguridad Avanzada**: Firewall integrado (WAF) con detección de ataques
- **Sistema de Hooks**: Similar al sistema de WordPress para extensibilidad
- **Autenticación Flexible**: Soporte para JWT, API Keys, Basic Auth, OAuth2, OpenID Connect
- **Almacenamiento de Tokens**: Soporte para memoria, JSON, SQLite y MariaDB
- **Enrutamiento Avanzado**: Soporte para rutas parametrizadas y anidadas
- **Soporte para Frontend**: Capacidad de servir contenido HTML y otros tipos de contenido
- **Configuración de Content-Type**: Especificación de headers Content-Type en routes.json
- **Middlewares Integrados**: CORS, rate limiting, compresión, firewall, etc.
- **Gestión de Controladores**: Carga dinámica de controladores desde archivos
- **Carga de Rutas**: Definición de rutas desde archivos JSON
- **Sistema de Sesiones**: Gestión completa de sesiones con soporte para autenticación
- **Motor de Plantillas MVC**: Sistema profesional de vistas con soporte para filtros, helpers y hooks
- **Extensibilidad**: Sistema de hooks y filters para personalización

## Instalación

```bash
npm install @jerkjs/jerk
```

## Uso Básico

```javascript
const { APIServer, Router, Logger } = require('@jerkjs/jerk');

// Crear instancia del servidor
const server = new APIServer({
  port: 3000,
  host: 'localhost'
});

// Crear instancia del logger
const logger = new Logger({ level: 'info' });

// Definir rutas
server.addRoute('GET', '/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: '¡Hola Mundo!' }));
});

// Iniciar el servidor
server.start();
```

## Componentes Principales

### APIServer
Servidor HTTP/HTTPS básico con soporte para rutas parametrizadas, middlewares y configuración avanzada.

### Router
Sistema de enrutamiento avanzado con soporte para rutas anidadas y prefijos.

### Authenticator
Middleware de autenticación con soporte para múltiples métodos (JWT, API Keys, Basic Auth, OAuth2, OpenID Connect).

### SecurityEnhancedServer
Servidor con funcionalidades de seguridad avanzada (WAF) integradas.

### RouteLoader
Carga de rutas desde archivos JSON con soporte para autenticación, controladores y especificación de content-type.

### TokenManager
Gestión de tokens JWT con diferentes tipos de almacenamiento (memoria, JSON, SQLite, MariaDB).

### Firewall
Middleware de firewall con detección de patrones de ataque y listas blancas/negras.

### Hooks System
Sistema de hooks y filters similar al de WordPress para extensibilidad.

### SessionManager
Sistema completo de gestión de sesiones con soporte para autenticación basada en sesiones.

### ViewEngine
Motor de plantillas profesional con soporte para filtros, helpers, condiciones, bucles y hooks.

### ControllerBase
Controlador base que facilita el desarrollo de controladores MVC con soporte para vistas.

## Seguridad

El framework incluye múltiples capas de seguridad:

- **Web Application Firewall (WAF)**: Detección de SQL injection, XSS, path traversal, etc.
- **Rate Limiting**: Limitación de peticiones por IP o usuario
- **Firewall**: Bloqueo automático por intentos fallidos
- **Listas Blancas/Negras**: Control de acceso por IP
- **Auditoría de Seguridad**: Registro de eventos de seguridad
- **Autenticación Robusta**: Soporte para múltiples métodos de autenticación

## Sistema de Hooks

El framework incluye un sistema de hooks y filters similar al de WordPress:

```javascript
const { hooks } = require('@jerkjs/jerk');

// Registrar una acción
hooks.addAction('firewall_request_blocked', (rule, clientIP, req, res) => {
  console.log(`Solicitud bloqueada: ${rule.name} para IP: ${clientIP}`);
});

// Registrar un filtro
hooks.addFilter('session_create_data', (userData, req) => {
  return {
    ...userData,
    ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    createdAt: new Date().toISOString()
  };
});
```

## Motor de Plantillas MVC

El framework incluye un motor de plantillas profesional con soporte para:

- Variables: `{{variable}}`
- Condiciones: `{{if variable}}contenido{{endif}}`
- Bucles: `{{foreach:array}}contenido{{endforeach}}`
- Inclusiones: `{{include:header}}`
- Filtros: `{{variable|upper}}`
- Helpers personalizados

## Gestión de Sesiones

El framework incluye un sistema completo de gestión de sesiones:

```javascript
const { SessionManager } = require('@jerkjs/jerk');

const sessionManager = new SessionManager({
  secret: 'your-session-secret',
  timeout: 3600000 // 1 hora
});

// Usar como middleware
server.use(sessionManager.middleware());
```

## Ejemplos

El proyecto incluye varios ejemplos completos:

- **v2_json_auth**: Autenticación JWT con tokens almacenados en JSON
- **v2_mariadb_auth**: Autenticación JWT con tokens almacenados en MariaDB
- **v2_sqlite_auth**: Autenticación JWT con tokens almacenados en SQLite
- **public**: API pública de ejemplo con CORS y rate limiting
- **frontend**: Ejemplo de servidor que combina API y frontend con diferentes content-types
- **hooks**: Ejemplo de uso del sistema de hooks

Para ver los ejemplos completos, visita los directorios `v2examplle/` y `examples/`.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o envía un pull request en GitHub.

## Licencia

Apache 2.0