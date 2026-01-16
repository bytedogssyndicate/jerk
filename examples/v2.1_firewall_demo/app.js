/**
 * Ejemplo de API con funcionalidades de firewall avanzado (v2.1.0)
 * Demostrando el uso del sistema de firewall con el sistema de hooks
 */

const {
  APIServer,
  Authenticator,
  RateLimiter,
  Logger,
  HookSystem,
  Firewall
} = require('../../index.js');

async function startServer() {
  // Crear instancia del servidor
  const server = new APIServer({
    port: 8097,
    host: 'localhost'
  });

  // Crear instancia del logger
  const logger = new Logger({ level: 'info' });

  // Crear instancia del sistema de hooks
  const hooks = new HookSystem();

  // Crear instancia del firewall
  const firewall = new Firewall({
    maxAttempts: 3,
    blockDuration: 300000, // 5 minutos para pruebas
    whitelist: ['127.0.0.1', '::1'], // IPs locales
    blacklist: [], // Ninguna IP bloqueada por defecto
    rules: [
      {
        name: 'large_payload',
        condition: (req) => {
          // Bloquear solicitudes con cuerpo muy grande
          const contentLength = req.headers['content-length'];
          return contentLength && parseInt(contentLength) > 1024 * 100; // 100KB
        },
        action: 'block',
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
    ],
    logger
  });

  try {
    // Registrar hooks para eventos de firewall
    hooks.addAction('firewall_rule_triggered', (rule, clientIP, req) => {
      logger.info(`[[FIREWALL-HOOK]] Regla activada: ${rule.name} para IP: ${clientIP}`);
    });

    hooks.addAction('firewall_ip_blocked', (ip, reason) => {
      logger.warn(`[[FIREWALL-HOOK]] IP bloqueada: ${ip} por razón: ${reason}`);
    });

    hooks.addAction('firewall_security_event', (event, details) => {
      logger.info(`[[FIREWALL-HOOK]] Evento de seguridad: ${event}`, details);
    });

    // Aplicar middleware de firewall al servidor
    server.use(firewall.middleware());

    // Ruta pública
    server.addRoute('GET', '/', (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'API con funcionalidades de firewall avanzado (v2.1.0)',
        features: [
          'Detección de patrones de ataque (SQL Injection, XSS, Path Traversal)',
          'Bloqueo de IPs tras intentos fallidos',
          'Listas blancas y negras de IPs',
          'Reglas personalizadas de firewall',
          'Sistema de hooks para eventos de seguridad',
          'Monitoreo de solicitudes sospechosas'
        ],
        firewallStatus: firewall.getStatus(),
        timestamp: new Date().toISOString()
      }));
    });

    // Ruta para probar diferentes tipos de ataques
    server.addRoute('GET', '/test-attacks', (req, res) => {
      // Disparar un hook personalizado para demostrar el sistema
      hooks.doAction('firewall_security_event', 'attack_test_requested', {
        clientIP: firewall.getClientIP(req),
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Prueba de ataques completada',
        clientIP: firewall.getClientIP(req),
        securityLevel: 'monitored',
        timestamp: new Date().toISOString()
      }));
    });

    // Ruta para probar SQL injection (esta debería ser bloqueada)
    server.addRoute('GET', '/test-sql-injection', (req, res) => {
      // Esta ruta no debería ser accesible si se detecta SQL injection en la URL
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: '¡Esto no debería verse si se detectó SQL injection!',
        status: 'compromised',
        timestamp: new Date().toISOString()
      }));
    });

    // Ruta para probar XSS (esta debería ser bloqueada)
    server.addRoute('GET', '/test-xss', (req, res) => {
      // Esta ruta no debería ser accesible si se detecta XSS en la URL
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: '¡Esto no debería verse si se detectó XSS!',
        status: 'compromised',
        timestamp: new Date().toISOString()
      }));
    });

    // Ruta para probar path traversal (esta debería ser bloqueada)
    server.addRoute('GET', '/test-path-traversal', (req, res) => {
      // Esta ruta no debería ser accesible si se detecta path traversal
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: '¡Esto no debería verse si se detectó path traversal!',
        status: 'compromised',
        timestamp: new Date().toISOString()
      }));
    });

    // Ruta para verificar estado del firewall
    server.addRoute('GET', '/firewall-status', (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        firewall: firewall.getStatus(),
        timestamp: new Date().toISOString()
      }));
    });

    // Iniciar el servidor
    server.start();

    logger.info('Servidor con firewall avanzado iniciado en http://localhost:8097');
    logger.info('Endpoints disponibles:');
    logger.info('- GET / - Página de inicio con información de firewall');
    logger.info('- GET /test-attacks - Prueba de detección de ataques');
    logger.info('- GET /test-sql-injection - Prueba de detección de SQL injection (será bloqueada)');
    logger.info('- GET /test-xss - Prueba de detección de XSS (será bloqueada)');
    logger.info('- GET /test-path-traversal - Prueba de detección de path traversal (será bloqueada)');
    logger.info('- GET /firewall-status - Estado actual del firewall');
  } catch (error) {
    logger.error('Error iniciando el servidor:', error.message);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

module.exports = { startServer };