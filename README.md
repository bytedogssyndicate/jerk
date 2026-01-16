# JERK Framework v2.0

![JERK Framework Logo](jerk.jpg)

Visita nuestra página web: https://jerk.page.gd/
Repositorio oficial: https://gitlab.com/bytedogssyndicate1/jerk/

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
npm install jerkjs
```

## Uso Básico

```javascript
const { APIServer, Router, Logger } = require('jerkjs');

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
const { hooks } = require('jerkjs');

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
const { SessionManager } = require('jerkjs');

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
- **hooks**: Ejemplo avanzado de uso del sistema de hooks con logging y seguimiento de solicitudes

Para ver los ejemplos completos, visita los directorios `v2examplle/` y `examples/`.

## Documentación

Además de la documentación en el README, el proyecto incluye documentación adicional:

- **Guía de inicio rápido**: `docs/guia_inicio_rapido_jerkjs.md` - Una guía completa para empezar rápidamente con JERKJS, incluyendo formatos de archivos, estructura de controladores, motor de plantillas y sistema de hooks.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o envía un pull request en GitHub.

## Licencia

Apache 2.0

## Diagrama de Arquitectura

```mermaid
graph TD
    A[HTTP Request] --> B[APIServer.handleRequest]
    B --> C[Parse URL: pathname, query]
    C --> D[Set req.query, req.params, req.body]
    D --> E[Capture request body with size limit]
    E --> F{bodySize > maxBodySize?}
    F -->|YES| G[413 Request Too Large]
    F -->|NO| H[End of data reception]
    H --> I{Is JSON content-type?}
    I -->|YES| J[Parse body as JSON]
    I -->|NO| K[Continue with raw body]
    J --> L{Is OPTIONS request?}
    K --> L
    L -->|YES| M[Execute CORS middleware]
    L -->|NO| N[Find matching route: findRoute(method, pathname)]
    M --> O{Has specific OPTIONS route?}
    O -->|YES| P[Add route params and execute handler]
    O -->|NO| Q[Send 204 No Content]
    N --> R{Route found?}
    R -->|NO| S[404 Not Found]
    R -->|YES| T[Add route params to req.params]
    T --> U[Execute registered middlewares in sequence]
    U --> V{Did middleware respond?}
    V -->|YES| W[End - Response sent]
    V -->|NO| X[Execute route handler]
    X --> Y{Is handler async?}
    Y -->|YES| Z[Await handler execution]
    Y -->|NO| AA[Execute handler synchronously]
    Z --> AB[End - Response sent]
    AA --> AB
    P --> AC[End - Response sent]

    BB[findRoute method] -.-> N
    BB -.-> DD[Check exact route match]
    DD --> EE{Exact match found?}
    EE -->|YES| FF[Return {route, empty params}]
    EE -->|NO| GG[Check parametrized routes]
    GG --> HH[Iterate through routes]
    HH --> II{Same HTTP method?}
    II -->|NO| JJ[Check next route]
    II -->|YES| KK[Convert route to regex: pathToRegex]
    KK --> LL{Does pathname match routeRegex?}
    LL -->|YES| MM[Extract params: extractParams]
    LL -->|NO| JJ
    MM --> NN[Return {route, extracted params}]
    JJ --> OO{More routes to check?}
    OO -->|YES| HH
    OO -->|NO| PP[Return null - No route found]

    QQ[Authentication Flow] -.-> RR[Authenticator.authenticate]
    RR --> SS[Get client IP]
    SS --> TT{Is IP blocked?}
    TT -->|YES| UU[403 Access denied by firewall]
    TT -->|NO| VV[Execute auth strategy]
    VV --> WW{Authentication successful?}
    WW -->|YES| XX[Log success, reset failed attempts, call next()]
    WW -->|NO| YY[Increment failed attempts, log failure, 401 Unauthorized]

    ZZ[Route Loading Flow] -.-> AAA[RouteLoader.loadRoutes]
    AAA --> BBB[Validate file exists]
    BBB --> CCC[Read and parse JSON routes]
    CCC --> DDD[Validate routes structure]
    DDD --> EEE[Iterate through each route]
    EEE --> FFF[Check route properties: method, path, controller, handler]
    FFF --> GGG[Load controller module]
    GGG --> HHH[Get handler function from controller]
    HHH --> III{Has custom contentType?}
    III -->|YES| JJJ[Create wrapper with setHeader]
    III -->|NO| KKK[Use handler directly]
    KKK --> LLL{Has authentication?}
    JJJ --> LLL
    LLL -->|YES| MMM[Apply authentication middleware]
    LLL -->|NO| NNN[Add route to server: server.addRoute]
    MMM --> NNN
    NNN --> OOO{More routes?}
    OOO -->|YES| EEE
    OOO -->|NO| PPP[Routes loaded successfully]

    QQQ[Firewall Flow] -.-> RRR[Firewall.middleware]
    RRR --> SSS[Get client IP]
    SSS --> TTT{Is IP blocked?}
    TTT -->|YES| UUU
    TTT -->|NO| VVV[Check rules: checkRules(req)]
    VVV --> WWW{Rule match found?}
    WWW -->|YES| XXX{Action is block?}
    WWW -->|NO| YYY[Allow request, call next()]
    XXX -->|YES| ZZZ[Increment failed attempts, 403 Forbidden]
    XXX -->|NO| AAAA[Continue with monitoring]
    AAAA --> YYY

    BBBB[View Engine Flow] -.-> CCCC[ViewEngine.render]
    CCCC --> DDDD[Get view path: getViewPath]
    DDDD --> EEEE{View file exists?}
    EEEE -->|NO| FFFF[Error: View not found]
    EEEE -->|YES| GGGG{Cache enabled and in cache?}
    GGGG -->|YES| HHHH[Get from cache]
    GGGG -->|NO| IIII[Read view content]
    IIII --> JJJJ[Process includes: processIncludes]
    JJJJ --> KKKK{Enable caching?}
    KKKK -->|YES| LLLL[Save to cache]
    KKKK -->|NO| MMMM[Continue without caching]
    LLLL --> NNNN[Process template: processTemplate]
    MMMM --> NNNN
    NNNN --> OOOO[Process foreach loops]
    OOOO --> PPPP[Process conditionals]
    PPPP --> QQQQ[Replace variables and filters]
    QQQQ --> RRRR[Return processed template]

    SSSS[Session Flow] -.-> TTTT[SessionManager.middleware]
    TTTT --> UUUU{Has session cookie?}
    UUUU -->|NO| VVVV[Create new session]
    UUUU -->|YES| WWWW[Validate existing session]
    VVVV --> XXXX[Add req.session]
    WWWW --> YYYY{Session valid?}
    YYYY -->|NO| VVVV
    YYYY -->|YES| ZZZZ[Update last activity]
    ZZZZ --> XXXX
    XXXX --> AAAAB[Call next()]

    QQ -.-> AAA
    ZZ -.-> BBB
    QQQ -.-> RRR
```