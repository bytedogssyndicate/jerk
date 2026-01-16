# Manual de Uso del Módulo de Firewall

## Índice
1. [Introducción](#introducción)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [Uso Básico](#uso-básico)
4. [Configuración Avanzada](#configuración-avanzada)
5. [Extensión del Firewall](#extensión-del-firewall)
6. [Eventos y Hooks](#eventos-y-hooks)
7. [Gestión de Listas](#gestión-de-listas)
8. [Ejemplos Prácticos](#ejemplos-prácticos)

## Introducción

El módulo de Firewall es una funcionalidad de seguridad integrada en el framework API SDK JS que proporciona una capa de protección contra patrones de ataque comunes como SQL Injection, Cross-Site Scripting (XSS), Path Traversal, y otros vectores de ataque. El firewall incluye detección automática de amenazas, bloqueo de IPs, listas blancas/negras y un sistema de reglas personalizables.

## Instalación y Configuración

El módulo de firewall está integrado en el framework y se puede importar directamente:

```javascript
const { APIServer, Firewall, Logger } = require('apisdk');
```

## Uso Básico

### 1. Crear una instancia del firewall

```javascript
const firewall = new Firewall({
  maxAttempts: 5,           // Número máximo de intentos fallidos antes de bloquear
  blockDuration: 900000,    // Duración del bloqueo en ms (15 minutos)
  whitelist: ['127.0.0.1'], // IPs que no deben ser bloqueadas
  blacklist: [],            // IPs que siempre deben ser bloqueadas
  rules: [],                // Reglas personalizadas de firewall
  logger: new Logger()      // Instancia de logger para eventos
});
```

### 2. Aplicar el middleware de firewall al servidor

```javascript
const server = new APIServer({ port: 3000 });

// Aplicar el middleware de firewall antes de iniciar el servidor
server.use(firewall.middleware());

server.start();
```

### 3. El firewall automáticamente:

- Detecta patrones de ataque en las solicitudes
- Bloquea IPs que superan el límite de intentos fallidos
- Aplica reglas personalizadas
- Verifica listas blancas y negras
- Emite eventos a través del sistema de hooks

## Configuración Avanzada

### Parámetros de Configuración

- `maxAttempts`: Número máximo de intentos fallidos antes de bloquear una IP (por defecto: 5)
- `blockDuration`: Duración del bloqueo en milisegundos (por defecto: 900000 = 15 minutos)
- `whitelist`: Array de IPs que nunca serán bloqueadas
- `blacklist`: Array de IPs que siempre serán bloqueadas
- `rules`: Array de reglas personalizadas de firewall
- `logger`: Instancia de logger para eventos de seguridad

### Reglas Personalizadas

Puedes definir reglas personalizadas para detectar patrones específicos:

```javascript
const customRules = [
  {
    name: 'large_payload',
    condition: (req) => {
      // Bloquear solicitudes con cuerpo muy grande
      const contentLength = req.headers['content-length'];
      return contentLength && parseInt(contentLength) > 1024 * 100; // 100KB
    },
    action: 'block',        // 'block' o 'monitor'
    reason: 'Solicitud con payload excesivamente grande'
  },
  {
    name: 'suspicious_user_agent',
    condition: (req) => {
      const userAgent = req.headers['user-agent'] || '';
      // Detectar user agents sospechosos
      const suspiciousAgents = [
        /sqlmap/i,
        /nikto/i,
        /nessus/i,
        /nmap/i,
        /dirbuster/i
      ];
      return suspiciousAgents.some(agent => agent.test(userAgent));
    },
    action: 'block',
    reason: 'User agent sospechoso detectado'
  }
];

const firewall = new Firewall({
  rules: customRules,
  // ... otras opciones
});
```

## Extensión del Firewall

El módulo de firewall es altamente extensible gracias al sistema de hooks integrado. Existen varias formas de extender su funcionalidad:

### 1. Añadiendo Reglas Personalizadas en Tiempo de Ejecución

```javascript
// Añadir una regla después de crear la instancia
firewall.addRule(
  'custom_attack_pattern', 
  (req, clientIP) => {
    // Tu lógica de detección aquí
    return req.url.includes('malicious-pattern');
  },
  'block',
  'Patrón de ataque personalizado detectado'
);
```

### 2. Utilizando el Sistema de Hooks

El firewall emite varios eventos que puedes interceptar para extender su comportamiento:

```javascript
const { HookSystem } = require('apisdk');
const hooks = new HookSystem();

// Hook cuando se recibe una solicitud
hooks.addAction('firewall_request_received', (req, res) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`);
});

// Hook cuando se activa una regla
hooks.addAction('firewall_rule_triggered', (rule, clientIP, req) => {
  console.log(`Regla activada: ${rule.name} para IP: ${clientIP}`);
});

// Hook cuando una IP es bloqueada
hooks.addAction('firewall_ip_blocked', (ip, reason, req, res) => {
  console.log(`IP bloqueada: ${ip} - Razón: ${reason}`);
});

// Hook cuando una solicitud es bloqueada
hooks.addAction('firewall_request_blocked', (rule, clientIP, req, res) => {
  console.log(`Solicitud bloqueada por regla: ${rule.name} para IP: ${clientIP}`);
});

// Hook cuando una solicitud es monitoreada
hooks.addAction('firewall_request_monitored', (rule, clientIP, req) => {
  console.log(`Solicitud monitoreada: ${rule.name} para IP: ${clientIP}`);
});

// Hook cuando una solicitud es permitida
hooks.addAction('firewall_request_allowed', (req, res) => {
  console.log(`Solicitud permitida: ${req.method} ${req.url}`);
});

// Hook cuando se actualiza la whitelist
hooks.addAction('firewall_whitelist_updated', (ip, action, whitelist) => {
  console.log(`Whitelist actualizada: IP ${ip} ${action}, total: ${whitelist.length}`);
});

// Hook cuando se actualiza la blacklist
hooks.addAction('firewall_blacklist_updated', (ip, action, blacklist) => {
  console.log(`Blacklist actualizada: IP ${ip} ${action}, total: ${blacklist.length}`);
});
```

### 3. Extensión mediante Filtros

También puedes usar filtros para modificar el comportamiento del firewall:

```javascript
// Filtrar la decisión de bloqueo
hooks.addFilter('modify_firewall_decision', (shouldBlock, req, res) => {
  // Lógica personalizada para decidir si se debe bloquear
  if (someCondition(req)) {
    return false; // No bloquear
  }
  return shouldBlock; // Mantener decisión original
});
```

### 4. Herencia y Personalización

Puedes extender la clase Firewall para añadir funcionalidades personalizadas:

```javascript
const { Firewall } = require('apisdk');

class CustomFirewall extends Firewall {
  constructor(options = {}) {
    super(options);
    this.customDetectionMethods = [];
  }

  // Añadir método de detección personalizado
  addCustomDetection(method) {
    this.customDetectionMethods.push(method);
  }

  // Sobreescribir el método de verificación de reglas
  checkRules(req) {
    // Primero ejecutar la lógica original
    const originalResult = super.checkRules(req);
    if (originalResult) {
      return originalResult;
    }

    // Luego verificar métodos de detección personalizados
    for (const method of this.customDetectionMethods) {
      const result = method(req, this.getClientIP(req));
      if (result) {
        return result;
      }
    }

    return null;
  }
}

// Uso del firewall personalizado
const customFirewall = new CustomFirewall({
  // opciones normales
});

customFirewall.addCustomDetection((req, clientIP) => {
  // Tu lógica personalizada de detección
  if (req.headers['x-custom-header'] === 'suspicious-value') {
    return {
      matched: true,
      rule: 'custom_header_check',
      action: 'block',
      reason: 'Cabecera personalizada sospechosa detectada'
    };
  }
  return null;
});
```

## Eventos y Hooks

El firewall emite los siguientes eventos:

- `firewall_request_received`: Cuando se recibe una solicitud
- `firewall_ip_blocked`: Cuando una IP es bloqueada
- `firewall_rule_triggered`: Cuando se activa una regla de firewall
- `firewall_request_blocked`: Cuando una solicitud es bloqueada
- `firewall_request_monitored`: Cuando una solicitud es monitoreada
- `firewall_request_allowed`: Cuando una solicitud es permitida
- `firewall_whitelist_updated`: Cuando se actualiza la whitelist
- `firewall_blacklist_updated`: Cuando se actualiza la blacklist

## Gestión de Listas

### Listas Blancas (Whitelist)

```javascript
// Añadir IP a la whitelist
firewall.addToWhitelist('192.168.1.100');

// Remover IP de la whitelist
firewall.removeFromWhitelist('192.168.1.100');
```

### Listas Negras (Blacklist)

```javascript
// Añadir IP a la blacklist
firewall.addToBlacklist('10.0.0.50', 'IP maliciosa detectada');

// Remover IP de la blacklist
firewall.removeFromBlacklist('10.0.0.50');
```

### Obtener Estado del Firewall

```javascript
const status = firewall.getStatus();
console.log(status);
/*
{
  blockedIPs: [...],
  whitelist: [...],
  blacklist: [...],
  totalBlocked: 0,
  rules: [...]
}
*/
```

## Ejemplos Prácticos

### Ejemplo Completo de API con Firewall

```javascript
const { APIServer, Firewall, Logger, HookSystem } = require('apisdk');

async function startSecureAPI() {
  // Crear servidor
  const server = new APIServer({
    port: 3000,
    host: 'localhost'
  });

  // Crear logger
  const logger = new Logger({ level: 'info' });

  // Crear firewall con configuración personalizada
  const firewall = new Firewall({
    maxAttempts: 3,
    blockDuration: 300000, // 5 minutos
    whitelist: ['127.0.0.1', '::1'],
    blacklist: [],
    rules: [
      {
        name: 'large_payload',
        condition: (req) => {
          const contentLength = req.headers['content-length'];
          return contentLength && parseInt(contentLength) > 1024 * 100; // 100KB
        },
        action: 'block',
        reason: 'Payload excesivamente grande'
      }
    ],
    logger
  });

  // Configurar hooks
  const hooks = new HookSystem();
  
  hooks.addAction('firewall_request_blocked', (rule, clientIP, req, res) => {
    logger.warn(`Solicitud bloqueada: ${rule.name} para IP: ${clientIP}`);
    // Aquí puedes añadir lógica adicional, como alertas o notificaciones
  });

  // Aplicar middleware de firewall
  server.use(firewall.middleware());

  // Añadir rutas
  server.addRoute('GET', '/', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'API segura con firewall activado',
      firewallStatus: firewall.getStatus()
    }));
  });

  // Iniciar servidor
  server.start();
}

startSecureAPI();
```

### Ejemplo de Extensión con Hooks

```javascript
const { APIServer, Firewall, Logger, HookSystem } = require('apisdk');

// Crear sistema de hooks
const hooks = new HookSystem();

// Crear firewall
const firewall = new Firewall({
  logger: new Logger()
});

// Extender funcionalidad con hooks
hooks.addAction('firewall_request_blocked', async (rule, clientIP, req, res) => {
  // Registrar intento de ataque en una base de datos
  await logSecurityIncident({
    ip: clientIP,
    rule: rule.name,
    url: req.url,
    userAgent: req.headers['user-agent'],
    timestamp: new Date()
  });
  
  // Enviar alerta si es necesario
  if (rule.name === 'sql_injection') {
    await sendAlertEmail('Ataque de SQL Injection detectado', clientIP);
  }
});

hooks.addAction('firewall_rule_triggered', (rule, clientIP, req) => {
  // Incrementar contador de amenazas para esta IP
  incrementThreatScore(clientIP);
});

// Aplicar firewall al servidor
const server = new APIServer({ port: 3000 });
server.use(firewall.middleware());
```

## Consideraciones de Seguridad

- Asegúrate de mantener actualizada la lista de IPs en la whitelist con direcciones confiables
- Monitorea regularmente las IPs bloqueadas para identificar falsos positivos
- Personaliza las reglas según las necesidades específicas de tu aplicación
- Utiliza los hooks para integrar con sistemas de alerta y monitoreo externos
- Considera implementar un sistema de "fail2ban" personalizado para bloqueos temporales automáticos

## Conclusión

El módulo de firewall proporciona una capa robusta de seguridad para tus APIs, con capacidad de extensión a través del sistema de hooks y reglas personalizadas. Su integración directa en el framework permite una implementación sencilla pero poderosa para proteger tus servicios web de amenazas comunes.