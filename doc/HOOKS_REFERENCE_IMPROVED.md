# Sistema de Hooks, Filters y Actions del Framework API SDK JS

Visita nuestra página web: https://jerk.page.gd/
Repositorio oficial: https://gitlab.com/bytedogssyndicate1/jerk/

## Índice
1. [Introducción](#introducción)
2. [Glosario de Términos](#glosario-de-términos)
3. [Referencia Rápida de Hooks](#referencia-rápida-de-hooks)
4. [Hooks del Firewall](#hooks-del-firewall)
5. [Hooks del Servidor](#hooks-del-servidor)
6. [Hooks del Sistema de Carga](#hooks-del-sistema-de-carga)
7. [Hooks del Sistema de Seguridad](#hooks-del-sistema-de-seguridad)
8. [Hooks del Sistema de Rutas](#hooks-del-sistema-de-rutas)
9. [Ejemplos Prácticos](#ejemplos-prácticos)
10. [Compatibilidad y Versionado](#compatibilidad-y-versionado)

## Introducción

El framework API SDK JS implementa un sistema de Hooks y Filters similar al sistema de WordPress, permitiendo extender y modificar el comportamiento del framework sin alterar su código base. Este documento enumera todos los hooks disponibles, clasificados por funcionalidad, con información sobre compatibilidad, ejemplos y orden de ejecución.

### Tipos de Hooks

- **Action**: Permite ejecutar código en puntos específicos del flujo de ejecución
- **Filter**: Permite modificar datos antes de que sean utilizados por otros componentes

## Glosario de Términos

- **Fingerprint de cliente**: Conjunto de datos únicos que identifican a un cliente, incluyendo IP, user agent, headers, etc.
- **Rate limiting**: Sistema para limitar la cantidad de solicitudes que un cliente puede hacer en un periodo determinado
- **Auditoría de seguridad**: Registro de eventos de seguridad para monitoreo y análisis
- **Hook**: Punto de extensión en el código donde se puede insertar lógica personalizada
- **Action**: Tipo de hook que permite ejecutar código sin modificar valores
- **Filter**: Tipo de hook que permite modificar valores antes de que sean utilizados

## Referencia Rápida de Hooks

| Nombre | Tipo | Versión | Descripción Corta |
|--------|------|---------|-------------------|
| `framework_init` | Action | 2.1.0 | Inicialización del framework |
| `pre_server_start` | Action | 1.0.0 | Antes de iniciar el servidor |
| `post_server_start` | Action | 1.0.0 | Después de iniciar el servidor |
| `pre_route_load` | Action | 1.0.0 | Antes de cargar rutas |
| `pre_controller_load` | Action | 1.0.0 | Antes de cargar controladores |
| `firewall_request_received` | Action | 2.2.0 | Recibida solicitud antes de firewall |
| `firewall_ip_blocked` | Action | 2.2.0 | IP bloqueada por firewall |
| `firewall_rule_triggered` | Action | 2.2.0 | Activada regla de firewall |
| `firewall_request_blocked` | Action | 2.2.0 | Solicitud bloqueada por firewall |
| `firewall_request_monitored` | Action | 2.2.0 | Solicitud monitoreada por firewall |
| `firewall_request_allowed` | Action | 2.2.0 | Solicitud permitida por firewall |
| `firewall_whitelist_updated` | Action | 2.2.0 | Actualizada lista blanca |
| `firewall_blacklist_updated` | Action | 2.2.0 | Actualizada lista negra |
| `before_request_processing` | Action | 2.1.0 | Antes de procesar solicitud |
| `request_validation` | Action | 2.1.0 | Validación de solicitud |
| `apply_rate_limiting` | Action | 2.1.0 | Aplicar limitación de tasa |
| `security_audit` | Action | 2.1.0 | Auditoría de seguridad |
| `security_attack_detected` | Action | 2.1.0 | Ataque detectado |
| `security_ip_blocked` | Action | 2.1.0 | IP bloqueada por seguridad |
| `security_log_recorded` | Action | 2.1.0 | Registro de seguridad |
| `rate_limit_exceeded` | Action | 2.1.0 | Límite de tasa excedido |
| `client_fingerprint` | Filter | 2.1.0 | Huella digital del cliente |
| `enhanced_client_fingerprint` | Filter | 2.1.0 | Huella digital mejorada |
| `modify_rate_limit_behavior` | Filter | 2.1.0 | Comportamiento de limitación |
| `post_request_processing` | Action | 2.1.0 | Después de procesar solicitud |

---

## Hooks del Firewall

### `firewall_request_received`
- **Tipo**: Action
- **Versión**: 2.2.0+
- **Descripción**: Se ejecuta cuando se recibe una solicitud antes de cualquier procesamiento de firewall
- **Parámetros**: `(req, res)`
  - `req`: Objeto de solicitud HTTP
  - `res`: Objeto de respuesta HTTP
- **Respuesta**: Ninguna
- **Localización**: `lib/middleware/firewall.js` (línea ~280)

### `firewall_ip_blocked`
- **Tipo**: Action
- **Versión**: 2.2.0+
- **Descripción**: Se ejecuta cuando una IP es bloqueada por el firewall
- **Parámetros**: `(ip, reason, req, res)`
  - `ip`: Dirección IP bloqueada
  - `reason`: Razón del bloqueo
  - `req`: Objeto de solicitud HTTP
  - `res`: Objeto de respuesta HTTP
- **Respuesta**: Ninguna
- **Localización**: `lib/middleware/firewall.js` (línea ~293)

### `firewall_rule_triggered`
- **Tipo**: Action
- **Versión**: 2.2.0+
- **Descripción**: Se ejecuta cuando se activa una regla de firewall
- **Parámetros**: `(rule, clientIP, req)`
  - `rule`: Objeto con información de la regla activada
  - `clientIP`: IP del cliente que activó la regla
  - `req`: Objeto de solicitud HTTP
- **Respuesta**: Ninguna
- **Localización**: `lib/middleware/firewall.js` (línea ~301)

### `firewall_request_blocked`
- **Tipo**: Action
- **Versión**: 2.2.0+
- **Descripción**: Se ejecuta cuando una solicitud es bloqueada por una regla de firewall
- **Parámetros**: `(rule, clientIP, req, res)`
  - `rule`: Objeto con información de la regla que bloqueó la solicitud
  - `clientIP`: IP del cliente cuya solicitud fue bloqueada
  - `req`: Objeto de solicitud HTTP
  - `res`: Objeto de respuesta HTTP
- **Respuesta**: Ninguna
- **Localización**: `lib/middleware/firewall.js` (línea ~312)

### `firewall_request_monitored`
- **Tipo**: Action
- **Versión**: 2.2.0+
- **Descripción**: Se ejecuta cuando una solicitud es monitoreada por una regla de firewall
- **Parámetros**: `(rule, clientIP, req)`
  - `rule`: Objeto con información de la regla que monitorea la solicitud
  - `clientIP`: IP del cliente cuya solicitud es monitoreada
  - `req`: Objeto de solicitud HTTP
- **Respuesta**: Ninguna
- **Localización**: `lib/middleware/firewall.js` (línea ~323)

### `firewall_request_allowed`
- **Tipo**: Action
- **Versión**: 2.2.0+
- **Descripción**: Se ejecuta cuando una solicitud pasa todas las verificaciones de firewall y es permitida
- **Parámetros**: `(req, res)`
  - `req`: Objeto de solicitud HTTP
  - `res`: Objeto de respuesta HTTP
- **Respuesta**: Ninguna
- **Localización**: `lib/middleware/firewall.js` (línea ~329)

### `firewall_whitelist_updated`
- **Tipo**: Action
- **Versión**: 2.2.0+
- **Descripción**: Se ejecuta cuando se actualiza la lista blanca (whitelist) de IPs
- **Parámetros**: `(ip, action, whitelist)`
  - `ip`: IP que se agregó/removió
  - `action`: Acción realizada ('added' o 'removed')
  - `whitelist`: Array actualizado de IPs en la whitelist
- **Respuesta**: Ninguna
- **Localización**: `lib/middleware/firewall.js` (línea ~357)

### `firewall_blacklist_updated`
- **Tipo**: Action
- **Versión**: 2.2.0+
- **Descripción**: Se ejecuta cuando se actualiza la lista negra (blacklist) de IPs
- **Parámetros**: `(ip, action, blacklist)`
  - `ip`: IP que se agregó/removió
  - `action`: Acción realizada ('added' o 'removed')
  - `blacklist`: Array actualizado de IPs en la blacklist
- **Respuesta**: Ninguna
- **Localización**: `lib/middleware/firewall.js` (línea ~370)

---

## Hooks del Servidor

### `framework_init`
- **Tipo**: Action
- **Versión**: 2.1.0+
- **Descripción**: Se ejecuta cuando se inicializa el framework
- **Parámetros**: Ninguno
- **Respuesta**: Ninguna
- **Localización**: `index.js` (línea ~69)

### `pre_server_start`
- **Tipo**: Action
- **Versión**: 1.0.0+
- **Descripción**: Se ejecuta antes de iniciar el servidor
- **Parámetros**: `(server)`
  - `server`: Instancia del servidor que va a iniciarse
- **Respuesta**: Ninguna
- **Localización**: `lib/core/server.js` (línea ~164) y `lib/core/securityEnhancedServer.js` (línea ~501)

### `post_server_start`
- **Tipo**: Action
- **Versión**: 1.0.0+
- **Descripción**: Se ejecuta después de iniciar el servidor
- **Parámetros**: `(server)`
  - `server`: Instancia del servidor que acaba de iniciarse
- **Respuesta**: Ninguna
- **Localización**: `lib/core/server.js` (línea ~176) y `lib/core/securityEnhancedServer.js` (línea ~507)

---

## Hooks del Sistema de Carga

### `pre_route_load`
- **Tipo**: Action
- **Versión**: 1.0.0+
- **Descripción**: Se ejecuta antes de cargar rutas desde un archivo
- **Parámetros**: `(filePath, server)`
  - `filePath`: Ruta al archivo de rutas que se va a cargar
  - `server`: Instancia del servidor al que se van a cargar las rutas
- **Respuesta**: Ninguna
- **Localización**: `lib/loader/routeLoader.js` (línea ~26)

### `pre_controller_load`
- **Tipo**: Action
- **Versión**: 1.0.0+
- **Descripción**: Se ejecuta antes de cargar un controlador desde un archivo
- **Parámetros**: `(controllerPath)`
  - `controllerPath`: Ruta al archivo del controlador que se va a cargar
- **Respuesta**: Ninguna
- **Localización**: `lib/loader/controllerLoader.js` (línea ~26)

---

## Hooks del Sistema de Seguridad

### `before_request_processing`
- **Tipo**: Action
- **Versión**: 2.1.0+
- **Descripción**: Se ejecuta antes de procesar una solicitud, para detección de posibles ataques. Este hook también puede usarse como filter para modificar el resultado del procesamiento.
- **Parámetros**: `(req, res)`
  - `req`: Objeto de solicitud HTTP
  - `res`: Objeto de respuesta HTTP
- **Respuesta**: Booleano que indica si continuar el procesamiento
- **Localización**: `lib/core/securityEnhancedServer.js` (línea ~44)

### `request_validation`
- **Tipo**: Action
- **Versión**: 2.1.0+
- **Descripción**: Se ejecuta para aplicar validaciones de seguridad a la solicitud
- **Parámetros**: `(req, res)`
  - `req`: Objeto de solicitud HTTP
  - `res`: Objeto de respuesta HTTP
- **Respuesta**: Booleano que indica si la solicitud pasó la validación
- **Localización**: `lib/core/securityEnhancedServer.js` (línea ~86)

### `apply_rate_limiting`
- **Tipo**: Action
- **Versión**: 2.1.0+
- **Descripción**: Se ejecuta para aplicar limitación de tasa basada en huella digital
- **Parámetros**: `(req, res, next)`
  - `req`: Objeto de solicitud HTTP
  - `res`: Objeto de respuesta HTTP
  - `next`: Función next para continuar con el middleware
- **Respuesta**: Ninguna
- **Localización**: `lib/core/securityEnhancedServer.js` (línea ~113)

### `security_audit`
- **Tipo**: Action
- **Versión**: 2.1.0+
- **Descripción**: Se ejecuta para auditoría de seguridad
- **Parámetros**: `(req, res, action, details)`
  - `req`: Objeto de solicitud HTTP
  - `res`: Objeto de respuesta HTTP
  - `action`: Acción de seguridad realizada
  - `details`: Detalles adicionales sobre el evento de seguridad
- **Respuesta**: Ninguna
- **Localización**: `lib/core/securityEnhancedServer.js` (línea ~128)

### `security_attack_detected`
- **Tipo**: Action
- **Versión**: 2.1.0+
- **Descripción**: Se ejecuta cuando se detecta un posible ataque
- **Parámetros**: `(attackResult, req, res)`
  - `attackResult`: Resultado de la detección del ataque
  - `req`: Objeto de solicitud HTTP
  - `res`: Objeto de respuesta HTTP
- **Respuesta**: Ninguna
- **Localización**: `lib/core/securityEnhancedServer.js` (línea ~50)

### `security_ip_blocked`
- **Tipo**: Action
- **Versión**: 2.1.0+
- **Descripción**: Se ejecuta cuando una IP es bloqueada por razones de seguridad
- **Parámetros**: `(clientIP, blockInfo, req, res)`
  - `clientIP`: IP que fue bloqueada
  - `blockInfo`: Información sobre el bloqueo
  - `req`: Objeto de solicitud HTTP
  - `res`: Objeto de respuesta HTTP
- **Respuesta**: Ninguna
- **Localización**: `lib/core/securityEnhancedServer.js` (línea ~94)

### `security_log_recorded`
- **Tipo**: Action
- **Versión**: 2.1.0+
- **Descripción**: Se ejecuta cuando se registra un evento de seguridad
- **Parámetros**: `(auditLog)`
  - `auditLog`: Objeto con información del evento de auditoría
- **Respuesta**: Ninguna
- **Localización**: `lib/core/securityEnhancedServer.js` (línea ~138)

### `rate_limit_exceeded`
- **Tipo**: Action
- **Versión**: 2.1.0+
- **Descripción**: Se ejecuta cuando se excede el límite de tasa
- **Parámetros**: `(clientId, req, res)`
  - `clientId`: ID del cliente que excedió el límite
  - `req`: Objeto de solicitud HTTP
  - `res`: Objeto de respuesta HTTP
- **Respuesta**: Ninguna
- **Localización**: `lib/core/securityEnhancedServer.js` (línea ~176)

---

## Hooks del Sistema de Rutas

### `client_fingerprint`
- **Tipo**: Filter
- **Versión**: 2.1.0+
- **Descripción**: Permite modificar la huella digital del cliente
- **Parámetros**: `(fingerprint, req)`
  - `fingerprint`: Objeto con la huella digital actual del cliente
  - `req`: Objeto de solicitud HTTP
- **Respuesta**: Objeto con la huella digital modificada
- **Localización**: `lib/core/securityEnhancedServer.js` (línea ~59)

### `enhanced_client_fingerprint`
- **Tipo**: Filter
- **Versión**: 2.1.0+
- **Descripción**: Permite modificar la huella digital mejorada del cliente
- **Parámetros**: `(enhancedFingerprint, req)`
  - `enhancedFingerprint`: Objeto con la huella digital mejorada actual
  - `req`: Objeto de solicitud HTTP
- **Respuesta**: Objeto con la huella digital mejorada modificada
- **Localización**: `lib/core/securityEnhancedServer.js` (línea ~82)

### `modify_rate_limit_behavior`
- **Tipo**: Filter
- **Versión**: 2.1.0+
- **Descripción**: Permite modificar el comportamiento de limitación de tasa
- **Parámetros**: `(rateLimitConfig, req)`
  - `rateLimitConfig`: Objeto con la configuración actual de limitación de tasa
  - `req`: Objeto de solicitud HTTP
- **Respuesta**: Objeto con la configuración modificada de limitación de tasa
- **Localización**: `lib/core/securityEnhancedServer.js` (línea ~162)

### `before_request_processing` (como Filter)
- **Tipo**: Filter
- **Versión**: 2.1.0+
- **Descripción**: Permite modificar el resultado del procesamiento previo de solicitud
- **Parámetros**: `(continueProcessing, req, res)`
  - `continueProcessing`: Booleano que indica si continuar el procesamiento
  - `req`: Objeto de solicitud HTTP
  - `res`: Objeto de respuesta HTTP
- **Respuesta**: Booleano que indica si continuar el procesamiento
- **Localización**: `lib/core/securityEnhancedServer.js` (línea ~430)

### `post_request_processing`
- **Tipo**: Action
- **Versión**: 2.1.0+
- **Descripción**: Se ejecuta después de procesar una solicitud
- **Parámetros**: `(req, res)`
  - `req`: Objeto de solicitud HTTP
  - `res`: Objeto de respuesta HTTP
- **Respuesta**: Ninguna
- **Localización**: `lib/core/securityEnhancedServer.js` (línea ~444)

---

## Hooks del Sistema MVC

### `template_pre_process`
- **Tipo**: Filter
- **Versión**: 2.3.0+
- **Descripción**: Se ejecuta antes de procesar un template de vista
- **Parámetros**: `(template, data)`
  - `template`: Cadena con el contenido del template antes de procesar
  - `data`: Objeto con los datos que se pasarán al template
- **Respuesta**: Cadena con el template modificado antes de procesar
- **Localización**: `lib/mvc/viewEngine.js` (línea ~178)

### `template_post_process`
- **Tipo**: Filter
- **Versión**: 2.3.0+
- **Descripción**: Se ejecuta después de procesar un template de vista
- **Parámetros**: `(template, data)`
  - `template`: Cadena con el contenido del template después de procesar
  - `data`: Objeto con los datos que se usaron en el template
- **Respuesta**: Cadena con el template modificado después de procesar
- **Localización**: `lib/mvc/viewEngine.js` (línea ~184)

---

## Ejemplos Prácticos

### Ejemplo de Uso de Actions

```javascript
const { HookSystem } = require('jerk');
const hooks = new HookSystem();

// Registrar un action para registrar solicitudes bloqueadas
hooks.addAction('firewall_ip_blocked', (ip, reason, req, res) => {
  console.log(`IP bloqueada: ${ip} - Razón: ${reason}`);
  // Aquí puedes añadir lógica adicional como enviar alertas
});

// Registrar un action para auditar solicitudes permitidas
hooks.addAction('firewall_request_allowed', (req, res) => {
  console.log(`Solicitud permitida: ${req.method} ${req.url}`);
});
```

### Ejemplo de Uso de Filters

```javascript
const { HookSystem } = require('jerk');
const hooks = new HookSystem();

// Registrar un filter para modificar la huella digital del cliente
hooks.addFilter('client_fingerprint', (fingerprint, req) => {
  // Añadir información adicional a la huella digital
  return {
    ...fingerprint,
    customField: req.headers['x-custom-header'] || 'unknown',
    processingTime: Date.now()
  };
});

// Registrar un filter para modificar el comportamiento de limitación de tasa
hooks.addFilter('modify_rate_limit_behavior', (rateLimitConfig, req) => {
  // Ajustar límites para ciertos clientes
  if (req.headers['x-trusted-client']) {
    return {
      ...rateLimitConfig,
      maxRequests: rateLimitConfig.maxRequests * 2 // Duplicar límite para clientes confiables
    };
  }
  return rateLimitConfig;
});
```

### Ejemplo Integrado de Múltiples Hooks

```javascript
const { APIServer, Firewall, HookSystem, Logger } = require('jerk');

async function startSecureAPIWithHooks() {
  const server = new APIServer({ port: 3000 });
  const logger = new Logger({ level: 'info' });
  const hooks = new HookSystem();
  const firewall = new Firewall({ logger });

  // Configurar hooks para monitoreo y alertas
  hooks.addAction('firewall_request_blocked', (rule, clientIP, req, res) => {
    logger.warn(`Solicitud bloqueada: ${rule.name} para IP: ${clientIP}`);
    // Enviar alerta si es un ataque grave
    if (rule.name === 'sql_injection') {
      sendSecurityAlert('Ataque de SQL Injection detectado', { ip: clientIP, url: req.url });
    }
  });

  hooks.addAction('firewall_rule_triggered', (rule, clientIP, req) => {
    logger.info(`Regla activada: ${rule.name} para IP: ${clientIP}`);
    // Incrementar puntuación de amenaza
    incrementThreatScore(clientIP);
  });

  hooks.addAction('firewall_ip_blocked', (ip, reason, req, res) => {
    logger.error(`IP bloqueada: ${ip} - ${reason}`);
    // Registrar en sistema de seguridad externo
    logSecurityIncident({
      type: 'IP_BLOCKED',
      ip,
      reason,
      timestamp: new Date()
    });
  });

  // Aplicar firewall al servidor
  server.use(firewall.middleware());

  server.start();
}

// Funciones auxiliares
function sendSecurityAlert(message, details) {
  // Lógica para enviar alerta de seguridad
  console.log(`SECURITY ALERT: ${message}`, details);
}

function incrementThreatScore(ip) {
  // Lógica para incrementar puntuación de amenaza
  console.log(`Incrementando puntuación de amenaza para IP: ${ip}`);
}

function logSecurityIncident(incident) {
  // Lógica para registrar incidente de seguridad
  console.log('Incidente de seguridad registrado:', incident);
}

startSecureAPIWithHooks();
```

### Ejemplo de Uso de Hooks en el Sistema MVC

```javascript
const { APIServer, Router, ControllerBase, ViewEngine, HookSystem } = require('jerk');

// Crear instancia del sistema de hooks
const hooks = new HookSystem();

// Crear ViewEngine con hooks
const viewEngine = new ViewEngine({
  viewsPath: './views',
  cacheEnabled: true,
  hooks: hooks  // Pasar la instancia de hooks al ViewEngine
});

// Ejemplo de uso de hooks para manipular templates
hooks.addFilter('template_pre_process', (template, data) => {
  // Añadir información global a todos los templates
  const globalData = {
    siteName: 'Mi Aplicación',
    version: '2.3.0',
    year: new Date().getFullYear()
  };

  // Inyectar variables globales en el template
  let processedTemplate = template;
  for (const [key, value] of Object.entries(globalData)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    processedTemplate = processedTemplate.replace(regex, String(value));
  }

  return processedTemplate;
});

hooks.addFilter('template_post_process', (template, data) => {
  // Añadir pie de página estándar a todas las vistas procesadas
  return template + `\n<footer>Versión ${data.version || 'desconocida'} - ${new Date().getFullYear()}</footer>`;
});

// Controlador con ejemplo de uso del sistema MVC
class HomeController extends ControllerBase {
  constructor(options = {}) {
    super({ ...options, viewEngine }); // Usar el ViewEngine con hooks
  }

  index(req, res) {
    this.set('title', 'Página de Inicio');
    this.set('message', '¡Bienvenido al sistema MVC!');
    this.set('version', '2.3.0');

    this.render(res, 'home/index');
  }
}

// Configurar servidor
const server = new APIServer({ port: 3000 });
const router = new Router();
const homeController = new HomeController({ viewsPath: './views' });

router.get('/', (req, res) => {
  homeController.setRequestResponse(req, res);
  homeController.index(req, res);
});

server.use(router);
server.start();
```

---

## Compatibilidad y Versionado

### Flujo de Ejecución de Hooks

1. **Inicialización del Framework**
   - `framework_init` (v2.1.0+)

2. **Antes de Iniciar el Servidor**
   - `pre_server_start` (v1.0.0+)

3. **Durante el Procesamiento de Solicitudes**
   - `firewall_request_received` (v2.2.0+)
   - `before_request_processing` (v2.1.0+) - Action
   - `before_request_processing` (v2.1.0+) - Filter
   - `request_validation` (v2.1.0+)
   - `apply_rate_limiting` (v2.1.0+)
   - `post_request_processing` (v2.1.0+)

4. **Después de Iniciar el Servidor**
   - `post_server_start` (v1.0.0+)

### Compatibilidad por Versión

- **v1.0.0**: Hooks básicos del servidor (`pre_server_start`, `post_server_start`)
- **v1.0.1**: Hooks del sistema de carga (`pre_route_load`, `pre_controller_load`)
- **v2.0.0**: No añade nuevos hooks
- **v2.1.0**: Sistema completo de hooks de seguridad y rutas
- **v2.2.0**: Hooks específicos del firewall
- **v2.3.0**: Hooks del sistema MVC (`template_pre_process`, `template_post_process`)

### Notas de Compatibilidad

- Los hooks introducidos en versiones posteriores a v2.1.0 dependen del sistema de hooks completo
- Algunos hooks pueden tener comportamientos diferentes en versiones anteriores
- Se recomienda verificar la versión del framework antes de usar hooks específicos
- Los hooks de firewall requieren la versión 2.2.0 o superior del framework
- Los hooks del sistema MVC requieren la versión 2.3.0 o superior del framework