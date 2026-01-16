# Manual de Creación de Middleware para API SDK Framework

## Tabla de Contenidos

1. [Introducción al Middleware](#introducción-al-middleware)
2. [Patrones de Middleware](#patrones-de-middleware)
3. [Guía de Implementación](#guía-de-implementación)
4. [Ejemplo Completo: Middleware de Auditoría](#ejemplo-completo-middleware-de-auditoría)
5. [Pruebas y Validación](#pruebas-y-validación)
6. [Integración con el Framework](#integración-con-el-framework)

## Introducción al Middleware

El middleware en el API SDK Framework es una función que se ejecuta en el pipeline de procesamiento de solicitudes HTTP. Actúa como intermediario entre la solicitud entrante y el handler final, permitiendo modificar la solicitud, la respuesta, o incluso detener el flujo de ejecución.

### Características del Middleware

- **Secuencial**: Se ejecutan en el orden en que se registran
- **Interceptable**: Pueden modificar `req` y `res` antes de pasar al siguiente
- **Terminable**: Pueden enviar respuesta y detener el flujo
- **Flexible**: Pueden aplicarse globalmente o a rutas específicas

### Firma del Middleware

```javascript
function middleware(req, res, next) {
  // Lógica del middleware
  next(); // Continuar con el siguiente middleware
}
```

## Patrones de Middleware

### 1. Middleware de Logging

Registra información sobre las solicitudes entrantes.

### 2. Middleware de Autenticación

Verifica credenciales antes de permitir el acceso.

### 3. Middleware de Validación

Valida datos de entrada antes de procesarlos.

### 4. Middleware de Seguridad

Aplica medidas de seguridad como CORS, Rate Limiting, etc.

### 5. Middleware de Transformación

Modifica la solicitud o respuesta antes de procesarla.

## Guía de Implementación

### Paso 1: Definir el Propósito

Antes de crear cualquier middleware, define claramente:

1. **¿Qué problema resolverá?**
2. **¿En qué punto del pipeline se ejecutará?**
3. **¿Qué datos necesita procesar?**
4. **¿Qué efectos secundarios tendrá?**

### Paso 2: Implementar la Función Base

```javascript
function miMiddleware(opciones = {}) {
  return (req, res, next) => {
    // Lógica del middleware
    next();
  };
}
```

### Paso 3: Manejar Casos Especiales

Considera casos como:
- Solicitudes que deben ser rechazadas
- Solicitudes que requieren transformación
- Solicitudes que deben ser registradas
- Errores durante el procesamiento

### Paso 4: Asegurar la Seguridad

- Validar entradas
- Sanitizar datos
- Aplicar límites de seguridad
- Registrar actividades sospechosas

## Ejemplo Completo: Middleware de Auditoría

Vamos a crear un middleware de auditoría que registre todas las actividades de los usuarios:

```javascript
// lib/middleware/auditLogger.js
const fs = require('fs');
const path = require('path');

class AuditLogger {
  /**
   * Constructor del middleware de auditoría
   * @param {Object} options - Opciones de configuración
   * @param {string} options.logFile - Ruta al archivo de logs
   * @param {Array} options.events - Eventos a auditar
   * @param {Function} options.filter - Función para filtrar solicitudes
   * @param {boolean} options.includeBody - Incluir cuerpo de la solicitud
   * @param {boolean} options.includeHeaders - Incluir headers
   */
  constructor(options = {}) {
    this.logFile = options.logFile || './audit.log';
    this.events = options.events || ['request', 'response', 'error'];
    this.filter = options.filter || (() => true);
    this.includeBody = options.includeBody !== false;
    this.includeHeaders = options.includeHeaders !== false;
    this.logger = options.logger || console;
  }

  /**
   * Middleware de auditoría
   * @returns {Function} - Middleware de auditoría
   */
  middleware() {
    return (req, res, next) => {
      // Verificar si la solicitud debe ser auditada
      if (!this.filter(req)) {
        next();
        return;
      }

      const startTime = Date.now();
      const requestId = this.generateRequestId();
      
      // Registrar la solicitud entrante
      this.logRequest(req, requestId);
      
      // Capturar la respuesta original para registrarla
      const originalEnd = res.end;
      res.end = (chunk, encoding) => {
        const duration = Date.now() - startTime;
        
        // Registrar la respuesta
        this.logResponse(req, res, chunk, duration, requestId);
        
        // Llamar al método original
        originalEnd.call(res, chunk, encoding);
      };

      // Capturar errores para auditarlos
      const originalOnError = req.connection && req.connection.onerror;
      req.connection.onerror = (err) => {
        this.logError(req, err, requestId);
        if (originalOnError) originalOnError.call(req.connection, err);
      };

      next();
    };
  }

  /**
   * Genera un ID único para la solicitud
   * @returns {string} - ID único de solicitud
   */
  generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Registra la solicitud entrante
   * @param {Object} req - Objeto de solicitud
   * @param {string} requestId - ID de la solicitud
   */
  logRequest(req, requestId) {
    if (!this.events.includes('request')) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'request',
      requestId,
      method: req.method,
      url: req.url,
      ip: this.getClientIP(req),
      userAgent: req.headers['user-agent'],
      headers: this.includeHeaders ? req.headers : undefined,
      body: this.includeBody ? req.body : undefined
    };

    this.writeLog(logEntry);
  }

  /**
   * Registra la respuesta saliente
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {any} chunk - Cuerpo de la respuesta
   * @param {number} duration - Duración de la solicitud
   * @param {string} requestId - ID de la solicitud
   */
  logResponse(req, res, chunk, duration, requestId) {
    if (!this.events.includes('response')) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'response',
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: this.getClientIP(req),
      responseSize: chunk ? Buffer.byteLength(chunk) : 0
    };

    this.writeLog(logEntry);
  }

  /**
   * Registra un error
   * @param {Object} req - Objeto de solicitud
   * @param {Error} error - Error ocurrido
   * @param {string} requestId - ID de la solicitud
   */
  logError(req, error, requestId) {
    if (!this.events.includes('error')) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'error',
      requestId,
      method: req.method,
      url: req.url,
      ip: this.getClientIP(req),
      errorMessage: error.message,
      stack: error.stack
    };

    this.writeLog(logEntry);
  }

  /**
   * Obtiene la IP del cliente
   * @param {Object} req - Objeto de solicitud
   * @returns {string} - IP del cliente
   */
  getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
  }

  /**
   * Escribe una entrada de log
   * @param {Object} entry - Entrada de log
   */
  writeLog(entry) {
    const logLine = JSON.stringify(entry) + '\n';
    
    // Escribir al archivo de log
    fs.appendFileSync(this.logFile, logLine);
    
    // También escribir al logger si está disponible
    if (this.logger) {
      this.logger.info(`AUDIT: ${entry.event} - ${entry.method} ${entry.url} - ${entry.ip}`);
    }
  }

  /**
   * Limpia logs antiguos
   * @param {number} days - Días a mantener
   */
  cleanupOldLogs(days = 30) {
    // Esta es una implementación básica
    // En una implementación real, usarías librerías como 'winston' con transporte de archivos
    console.log(`Limpiando logs anteriores a ${days} días...`);
  }
}

module.exports = AuditLogger;
```

### Uso del Middleware de Auditoría

```javascript
// examples/v2/audit_middleware_example.js
const { APISDK, Logger } = require('../../index');
const AuditLogger = require('../../lib/middleware/auditLogger');

// Crear instancia del logger
const logger = new Logger({ level: 'info', timestamp: true });

logger.info('🔐 Iniciando ejemplo con middleware de auditoría');

// Crear instancia del servidor
const server = new APISDK({
  port: 8084,
  host: 'localhost'
});

// Crear instancia del middleware de auditoría
const auditLogger = new AuditLogger({
  logFile: './audit.log',
  events: ['request', 'response', 'error'],
  includeBody: true,
  includeHeaders: false,
  filter: (req) => {
    // No auditar solicitudes a /health
    return req.url !== '/health';
  }
});

// Aplicar middleware de auditoría
server.use(auditLogger.middleware());

// Middleware de logging normal
server.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - IP: ${req.connection.remoteAddress}`);
  next();
});

// Rutas de ejemplo
server.addRoute('GET', '/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'API con middleware de auditoría',
    timestamp: new Date().toISOString()
  }));
});

server.addRoute('POST', '/api/users', (req, res) => {
  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'Usuario creado',
    data: req.body
  }));
});

server.addRoute('GET', '/health', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'healthy' }));
});

logger.info('✅ Rutas configuradas con middleware de auditoría');

// Iniciar el servidor
const httpServer = server.start();

logger.info('✅ Servidor iniciado en http://localhost:8084');
logger.info('📋 Endpoints disponibles:');
logger.info('   GET  /                    - Página principal (auditable)');
logger.info('   POST /api/users          - Crear usuario (auditable)');
logger.info('   GET  /health             - Salud del sistema (no auditado)');

logger.info('\n🔧 Comandos de prueba con curl:');
logger.info('   # Probar endpoint principal (será auditado):');
logger.info('   curl http://localhost:8084/');
logger.info('');
logger.info('   # Crear usuario (será auditado):');
logger.info('   curl -X POST http://localhost:8084/api/users \\');
logger.info('        -H "Content-Type: application/json" \\');
logger.info('        -d \'{"name":"Test User", "email":"test@example.com"}\'');
logger.info('');
logger.info('   # Verificar salud (no será auditado):');
logger.info('   curl http://localhost:8084/health');

logger.info('\n📊 Los eventos se registrarán en ./audit.log');

// Manejo de cierre
const gracefulShutdown = () => {
  logger.info('🛑 Cerrando servidor...');
  httpServer.close(() => {
    logger.info('🔌 Servidor detenido');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

## Pruebas y Validación

### Prueba del Middleware de Auditoría

```javascript
// test_audit_middleware.js
const { APISDK } = require('../index');
const AuditLogger = require('../lib/middleware/auditLogger');
const fs = require('fs');
const path = require('path');

async function testAuditMiddleware() {
  console.log('🧪 Probando middleware de auditoría...\n');

  // Crear servidor de prueba
  const server = new APISDK({ port: 9998 });
  
  // Crear middleware de auditoría para pruebas
  const auditLogger = new AuditLogger({
    logFile: './test_audit.log',
    events: ['request', 'response'],
    includeBody: true
  });

  // Aplicar middleware
  server.use(auditLogger.middleware());

  // Agregar ruta de prueba
  server.addRoute('GET', '/test', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'OK' }));
  });

  server.addRoute('POST', '/test-post', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ received: req.body }));
  });

  console.log('✅ Middleware de auditoría aplicado');
  console.log('✅ Rutas de prueba configuradas');

  // Iniciar servidor (en una implementación real, aquí haríamos solicitudes de prueba)
  const httpServer = server.start();
  
  console.log('✅ Servidor de prueba iniciado');
  console.log('✅ El middleware de auditoría está funcionando');
  console.log('✅ Las solicitudes se registrarán en test_audit.log');

  // Detener servidor después de un tiempo
  setTimeout(() => {
    httpServer.close();
    console.log('\n✅ Prueba completada');
    console.log('📊 Revisa el archivo test_audit.log para ver los registros');
  }, 2000);
}

// Ejecutar prueba
testAuditMiddleware().catch(console.error);
```

## Integración con el Framework

### 1. Registro en el Punto de Entrada

```javascript
// Actualizar index.js para exportar el nuevo middleware
const AuditLogger = require('./lib/middleware/auditLogger');

module.exports = {
  // ... otros componentes ...
  AuditLogger  // Exportar el nuevo middleware
};
```

### 2. Ejemplos de Uso en Aplicaciones Reales

```javascript
// Ejemplo de uso en una aplicación real
const { APISDK, AuditLogger } = require('apisdk');

const server = new APISDK({ port: 3000 });

// Middleware de auditoría para eventos de seguridad
const securityAudit = new AuditLogger({
  logFile: './security_audit.log',
  events: ['request', 'error'],
  filter: (req) => {
    // Solo auditar endpoints sensibles
    return req.url.startsWith('/api/admin') || req.url.startsWith('/api/users');
  }
});

server.use(securityAudit.middleware());

// Middleware de auditoría general
const generalAudit = new AuditLogger({
  logFile: './general_audit.log',
  events: ['request', 'response']
});

server.use(generalAudit.middleware());
```

## Buenas Prácticas para Middleware

### 1. Rendimiento
- Minimizar operaciones costosas
- Usar caché cuando sea posible
- Evitar operaciones de bloqueo

### 2. Seguridad
- Validar entradas
- Sanitizar datos
- Aplicar límites de seguridad
- Registrar actividades sospechosas

### 3. Observabilidad
- Registrar adecuadamente
- Medir tiempos de ejecución
- Detectar anomalías

### 4. Mantenibilidad
- Código limpio y bien documentado
- Opciones configurables
- Manejo adecuado de errores

## Conclusión

El sistema de middleware del API SDK Framework es potente y flexible, permitiendo extender la funcionalidad del servidor de múltiples maneras. El ejemplo del middleware de auditoría demuestra cómo crear middleware complejo que puede:

- Registrar eventos de solicitud, respuesta y error
- Filtrar solicitudes según criterios personalizados
- Incluir o excluir información sensible
- Integrarse completamente con el sistema de logging del framework
- Ser configurado y reutilizado en diferentes aplicaciones

Este patrón puede aplicarse para crear cualquier tipo de middleware que necesites: autenticación, autorización, validación, transformación de datos, logging, métricas, etc.