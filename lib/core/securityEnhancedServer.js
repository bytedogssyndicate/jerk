/**
 * Implementación completa del sistema de seguridad avanzada (WAF)
 * usando el sistema de hooks y filters para extensibilidad
 * Web Application Firewall con capacidades de detección y prevención de ataques
 */

const APIServer = require('../core/server');
const Authenticator = require('../middleware/authenticator');
const RateLimiter = require('../middleware/rateLimiter');
const { Logger } = require('../utils/logger');
const HookSystem = require('./hooks');

class SecurityEnhancedServer {
  constructor(options = {}) {
    this.server = new APIServer(options);
    this.logger = new Logger({ level: 'info' });
    this.authenticator = new Authenticator({ logger: this.logger });
    this.rateLimiter = new RateLimiter(options.rateLimiter || {});
    this.hooks = new HookSystem();

    // Inicializar componentes de seguridad
    this.attackDetector = new AttackDetector({ logger: this.logger });
    this.clientFingerprinter = new ClientFingerprinter({ logger: this.logger });
    this.firewall = new Firewall({
      logger: this.logger,
      maxAttempts: options.maxAttempts || 5,
      blockDuration: options.blockDuration || 900000, // 15 minutos
      whitelist: options.whitelist || [],
      blacklist: options.blacklist || [],
      rules: options.rules || []
    });

    // Registrar hooks y filtros de seguridad
    this.registerSecurityHooks();
  }

  /**
   * Registra los hooks y filtros de seguridad
   */
  registerSecurityHooks() {
    // Hook para detectar posibles ataques antes de procesar la solicitud
    this.hooks.addAction('before_request_processing', async (req, res) => {
      // Usar el detector de ataque avanzado
      const attackResult = this.attackDetector.detect(req);

      if (attackResult) {
        this.logger.warn(`Patrón de ataque detectado: ${attackResult} desde IP: ${this.getClientIP(req)}`);

        // Disparar hook de evento de seguridad
        this.hooks.doAction('security_attack_detected', attackResult, req, res);

        // Bloquear IP
        this.firewall.blockIP(this.getClientIP(req), attackResult);

        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Solicitud bloqueada por seguridad', reason: attackResult }));
        return false;
      }

      return true;
    });

    // Filtro para mejorar la huella digital del cliente
    this.hooks.addFilter('client_fingerprint', (fingerprint, req) => {
      const enhancedFingerprint = {
        ...fingerprint,
        userAgentHash: this.hashString(req.headers['user-agent'] || ''),
        acceptHeaders: req.headers['accept'] || '',
        language: req.headers['accept-language'] || '',
        encoding: req.headers['accept-encoding'] || '',
        contentType: req.headers['content-type'] || '',
        forwardedFor: req.headers['x-forwarded-for'] || '',
        realIP: req.headers['x-real-ip'] || '',
        // Agregar información adicional para WAF
        acceptCharset: req.headers['accept-charset'] || '',
        connection: req.headers['connection'] || '',
        pragma: req.headers['pragma'] || '',
        cacheControl: req.headers['cache-control'] || '',
        userAgentTokens: this.tokenizeUserAgent(req.headers['user-agent'] || ''),
        suspiciousHeaders: this.detectSuspiciousHeaders(req.headers)
      };

      // Permitir que otros módulos modifiquen la huella digital
      return this.hooks.applyFilters('enhanced_client_fingerprint', enhancedFingerprint, req);
    });

    // Hook para aplicar firewall a la solicitud
    this.hooks.addAction('request_validation', (req, res) => {
      const clientIP = this.getClientIP(req);

      // Verificar si la IP está bloqueada
      const blockInfo = this.firewall.isBlocked(clientIP);
      if (blockInfo.blocked) {
        this.logger.warn(`Solicitud bloqueada desde IP: ${clientIP}, razón: ${blockInfo.reason}`);

        // Disparar hook de evento de seguridad
        this.hooks.doAction('security_ip_blocked', clientIP, blockInfo, req, res);

        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'IP bloqueada por violaciones de seguridad',
          reason: blockInfo.reason,
          blockedUntil: blockInfo.blockedUntil
        }));
        return false;
      }

      // Verificar reglas personalizadas de firewall
      const ruleMatch = this.firewall.checkRules(req);
      if (ruleMatch) {
        this.logger.warn(`Regla de firewall activada: ${ruleMatch.rule} para IP: ${clientIP}, razón: ${ruleMatch.reason}`);

        if (ruleMatch.action === 'block') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Solicitud bloqueada por regla de firewall',
            reason: ruleMatch.reason,
            rule: ruleMatch.rule
          }));
          return false;
        } else if (ruleMatch.action === 'monitor') {
          // Registrar pero permitir continuar
          this.logger.info(`Solicitud monitoreada por regla: ${ruleMatch.rule}, IP: ${clientIP}`);
        }
      }

      return true;
    });

    // Hook para aplicar rate limiting basado en huella digital
    this.hooks.addAction('apply_rate_limiting', (req, res, next) => {
      // Obtener huella digital del cliente
      const fingerprint = this.clientFingerprinter.generate(req);
      const enhancedFingerprint = this.hooks.applyFilters('client_fingerprint', fingerprint, req);
      const clientId = this.generateClientId(enhancedFingerprint);

      // Aplicar rate limiting basado en huella digital
      this.applyRateLimiting(clientId, req, res, next);
    });

    // Hook para auditoría de seguridad
    this.hooks.addAction('security_audit', (req, res, action, details) => {
      const auditLog = {
        timestamp: new Date().toISOString(),
        clientIP: this.getClientIP(req),
        userAgent: req.headers['user-agent'],
        method: req.method,
        url: req.url,
        action: action,
        details: details,
        fingerprint: this.clientFingerprinter.generate(req)
      };

      // Disparar hook para procesamiento de logs de auditoría
      this.hooks.doAction('security_log_recorded', auditLog);
    });
  }

  /**
   * Aplica rate limiting basado en huella digital
   */
  applyRateLimiting(clientId, req, res, next) {
    // Permitir que otros módulos modifiquen el comportamiento de rate limiting
    const rateLimitResult = this.hooks.applyFilters('modify_rate_limit_behavior', {
      clientId,
      currentCount: this.getCurrentRequestCount(clientId),
      maxRequests: this.rateLimiter.maxRequests,
      windowMs: this.rateLimiter.windowMs
    }, req);

    if (rateLimitResult.currentCount >= rateLimitResult.maxRequests) {
      // Disparar hook de evento de seguridad
      this.hooks.doAction('rate_limit_exceeded', clientId, req, res);

      const timeLeft = this.getTimeUntilReset(clientId);
      if (!res.headersSent) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Límite de solicitudes excedido',
          retryAfter: Math.floor(timeLeft / 1000) + ' segundos'
        }));
      }
      return;
    }

    // Incrementar conteo y continuar
    this.incrementRequestCount(clientId);
    if (next) {
      next();
    }
  }

  /**
   * Obtiene la IP del cliente
   */
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           (req.connection?.socket ? req.connection.socket.remoteAddress : 'unknown');
  }

  /**
   * Tokeniza el user agent para análisis
   */
  tokenizeUserAgent(userAgent) {
    // Dividir el user agent en tokens para análisis
    return userAgent
      .toLowerCase()
      .replace(/[()]/g, ' ')
      .split(/[\s;/_\-,.]+/)
      .filter(token => token.length > 0);
  }

  /**
   * Detecta headers sospechosos
   */
  detectSuspiciousHeaders(headers) {
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-originating-ip',
      'x-remote-ip',
      'x-remote-addr',
      'x-proxy-user-ip',
      'cf-connecting-ip',
      'true-client-ip',
      'x-cluster-client-ip',
      'x-forwarded',
      'x-forwarded-host',
      'x-forwarded-server',
      'x-original-forwarded-for',
      'x-original-host',
      'x-proxy-id'
    ];

    const detected = [];
    for (const [header, value] of Object.entries(headers)) {
      if (suspiciousHeaders.includes(header.toLowerCase())) {
        detected.push({ header, value });
      }
    }

    return detected;
  }

  /**
   * Detecta patrones de ataque en la solicitud
   */
  detectAttackPatterns(req) {
    const path = req.url;
    const body = req.body || '';
    const headers = req.headers;

    // Patrones de SQL Injection
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT|TRUNCATE|DECLARE|MERGE|GRANT|REVOKE|CALL|LOAD|COPY|BULK|INTO|OUTFILE|DUMPFILE)\b)/gi,
      /('|--|#|\/\*|\*\/|;|xp_|sp_|sysobjects|syscolumns|information_schema)/gi
    ];

    // Patrones de XSS
    const xssPatterns = [
      /(<script|javascript:|vbscript:|onload|onerror|onmouseover|onclick|onfocus|onblur|onchange|onselect|onsubmit|onkeydown|onkeypress|onkeyup|onabort|onafterprint|onbeforeprint|onbeforeunload|onblur|oncanplay|oncanplaythrough|onchange|onclick|oncontextmenu|oncopy|oncut|ondblclick|ondrag|ondragend|ondragenter|ondragleave|ondragover|ondragstart|ondrop|ondurationchange|onended|onerror|onfocus|onfocusin|onfocusout|onfullscreenchange|onfullscreenerror|onhashchange|oninput|oninvalid|onkeydown|onkeypress|onkeyup|onload|onloadeddata|onloadedmetadata|onloadstart|onmessage|onmousedown|onmouseenter|onmouseleave|onmousemove|onmouseout|onmouseover|onmouseup|onmousewheel|onoffline|ononline|onpagehide|onpageshow|onpaste|onpause|onplay|onplaying|onpopstate|onprogress|onratechange|onreset|onresize|onscroll|onsearch|onseeked|onseeking|onselect|onshow|onstalled|onstorage|onsubmit|onsuspend|ontimeupdate|ontoggle|onunload|onvolumechange|onwaiting|onwheel)/gi,
      /(src|href|background|action)=["']?\s*(javascript:|data:|vbscript:)/gi,
      /<iframe/gi,
      /<img[^>]*src[\\s]*=[\\s]*["'][\\s]*(javascript:|data:)/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ];

    // Patrones de Path Traversal
    const pathTraversal = /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c|%c0%ae%c0%ae%c0%af|%uff0e%uff0e%u2215|%uff0e%uff0e%u2216)/gi;

    // Patrones de Command Injection
    const cmdInjection = [
      /(;|\||`|>|<|&)/g,
      /\b(cat|ls|dir|pwd|whoami|uname|ps|kill|rm|mv|cp|touch|mkdir|rmdir|chmod|chown|wget|curl|nc|netcat|ping|traceroute|nslookup|dig|ifconfig|ip|route|netstat|crontab|passwd|shadow|sudo|su)\b/gi
    ];

    // Verificar patrones en URL
    for (const pattern of sqlPatterns) {
      if (pattern.test(path)) {
        return { type: 'sql_injection', pattern: pattern.toString() };
      }
    }

    for (const pattern of xssPatterns) {
      if (pattern.test(path)) {
        return { type: 'xss_attack', pattern: pattern.toString() };
      }
    }

    if (pathTraversal.test(path)) {
      return { type: 'path_traversal', pattern: pathTraversal.toString() };
    }

    for (const pattern of cmdInjection) {
      if (pattern.test(path)) {
        return { type: 'command_injection', pattern: pattern.toString() };
      }
    }

    // Verificar patrones en body si es string
    if (typeof body === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(body)) {
          return { type: 'sql_injection', pattern: pattern.toString() };
        }
      }

      for (const pattern of xssPatterns) {
        if (pattern.test(body)) {
          return { type: 'xss_attack', pattern: pattern.toString() };
        }
      }

      for (const pattern of cmdInjection) {
        if (pattern.test(body)) {
          return { type: 'command_injection', pattern: pattern.toString() };
        }
      }
    }

    // Verificar headers sospechosos
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-originating-ip',
      'x-remote-ip',
      'x-remote-addr',
      'x-proxy-user-ip',
      'cf-connecting-ip'
    ];

    let suspiciousHeaderCount = 0;
    for (const header of suspiciousHeaders) {
      if (headers[header]) {
        suspiciousHeaderCount++;
      }
    }

    if (suspiciousHeaderCount > 3) {
      return { type: 'header_spoofing', count: suspiciousHeaderCount };
    }

    return null;
  }

  /**
   * Genera un ID de cliente basado en huella digital
   */
  generateClientId(fingerprint) {
    // Generar un hash único basado en la huella digital
    return this.hashString(JSON.stringify(fingerprint));
  }

  /**
   * Hash simple para cadenas
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Obtiene el conteo actual de solicitudes
   */
  getCurrentRequestCount(clientId) {
    if (!this.requestCounts) this.requestCounts = new Map();
    const entry = this.requestCounts.get(clientId);
    if (!entry) return 0;

    // Verificar si ha expirado
    if (Date.now() - entry.startTime > this.rateLimiter.windowMs) {
      this.requestCounts.delete(clientId);
      return 0;
    }

    return entry.count;
  }

  /**
   * Incrementa el conteo de solicitudes
   */
  incrementRequestCount(clientId) {
    if (!this.requestCounts) this.requestCounts = new Map();

    const entry = this.requestCounts.get(clientId);
    const now = Date.now();

    if (!entry) {
      this.requestCounts.set(clientId, { count: 1, startTime: now });
    } else {
      if (now - entry.startTime > this.rateLimiter.windowMs) {
        this.requestCounts.set(clientId, { count: 1, startTime: now });
      } else {
        entry.count++;
      }
    }
  }

  /**
   * Obtiene el tiempo restante hasta el reset del rate limit
   */
  getTimeUntilReset(clientId) {
    if (!this.requestCounts) this.requestCounts = new Map();
    const entry = this.requestCounts.get(clientId);
    if (!entry) return this.rateLimiter.windowMs;

    const elapsed = Date.now() - entry.startTime;
    return Math.max(0, this.rateLimiter.windowMs - elapsed);
  }

  /**
   * Middleware de seguridad avanzada
   */
  securityMiddleware() {
    return async (req, res, next) => {
      try {
        // Asegurarse de que req tenga las propiedades necesarias
        if (!req || typeof req !== 'object') {
          this.logger.error('Solicitud inválida recibida en middleware de seguridad');
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Solicitud inválida' }));
          return;
        }

        // Asegurarse de que req.headers exista
        if (!req.headers) {
          req.headers = {};
        }

        // Disparar hook antes de procesar la solicitud
        this.hooks.doAction('pre_request_processing', req, res);

        // Aplicar hooks de seguridad en orden
        const continueProcessing = await this.hooks.applyFilters('before_request_processing', true, req, res);

        if (!continueProcessing) {
          return; // La solicitud fue bloqueada por seguridad
        }

        // Generar huella digital del cliente
        const fingerprint = this.clientFingerprinter.generate(req);
        const enhancedFingerprint = this.hooks.applyFilters('client_fingerprint', fingerprint, req);

        // Validar con firewall - el firewall modifica directamente la respuesta si es necesario
        this.hooks.doAction('request_validation', req, res);
        // Si headers ya fueron enviados, significa que el firewall bloqueó la solicitud
        if (res.headersSent) {
          return; // La solicitud fue bloqueada por el firewall
        }

        // Aplicar rate limiting - el rate limiter llama a next() internamente si no hay límite excedido
        this.hooks.doAction('apply_rate_limiting', req, res, next);

        // Disparar hook después de procesar la solicitud (pero antes de next)
        this.hooks.doAction('post_request_processing', req, res);
      } catch (error) {
        this.logger.error('Error en middleware de seguridad:', error.message);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error interno del servidor' }));
        }
      }
    };
  }

  /**
   * Inicia el servidor con seguridad avanzada
   */
  start() {
    // Disparar hook antes de iniciar el servidor
    this.hooks.doAction('pre_server_start', this.server);

    // Aplicar middleware de seguridad antes de otros middlewares
    this.server.use(this.securityMiddleware());

    // Iniciar el servidor
    this.server.start();

    // Disparar hook después de iniciar el servidor
    this.hooks.doAction('post_server_start', this.server);

    this.logger.info('Servidor iniciado con funcionalidades de seguridad avanzada');
  }

  /**
   * Registra una regla personalizada de firewall
   * @param {string} name - Nombre de la regla
   * @param {Function} condition - Función de condición que evalúa la solicitud
   * @param {string} action - Acción a tomar ('block', 'monitor', etc.)
   * @param {string} reason - Razón para el bloqueo o monitoreo
   */
  addFirewallRule(name, condition, action = 'block', reason = 'Violación de regla personalizada') {
    this.firewall.addRule(name, condition, action, reason);
  }

  /**
   * Registra un detector de ataques personalizado
   * @param {string} name - Nombre del detector
   * @param {Function} detector - Función que detecta patrones de ataque
   */
  addAttackDetector(name, detector) {
    this.attackDetector.addCustomDetector(name, detector);
  }
}

// Clases auxiliares para las funcionalidades de seguridad

class AttackDetector {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.customDetectors = new Map(); // Map<name, detectorFunction>

    // Patrones comunes de ataque
    this.sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /('|--|#|\/\*|\*\/|;)/g
    ];

    this.xssPatterns = [
      /(<script|javascript:|vbscript:|onload|onerror|onmouseover|onclick|onfocus|onblur)/gi,
      /(src|href)=["']javascript:/gi,
      /<iframe/gi,
      /<img[^>]*src[\\s]*=[\\s]*["'][\\s]*(javascript:|data:)/gi
    ];

    this.pathTraversal = /\.\.\//g;
  }

  /**
   * Detecta patrones de ataque en la solicitud
   * @param {Object} req - Objeto de solicitud
   * @returns {string|null} - Tipo de ataque detectado o null si ninguno
   */
  detect(req) {
    // Usar el método de detección de patrones avanzados
    const attackResult = this.detectAttackPatterns(req);

    if (attackResult) {
      return attackResult.type;
    }

    // Ejecutar detectores personalizados
    for (const [name, detector] of this.customDetectors) {
      const result = detector(req);
      if (result) {
        return result;
      }
    }

    return null;
  }

  /**
   * Agrega un detector de ataques personalizado
   * @param {string} name - Nombre del detector
   * @param {Function} detector - Función de detección
   */
  addCustomDetector(name, detector) {
    this.customDetectors.set(name, detector);
    this.logger.info(`Detector de ataque personalizado agregado: ${name}`);
  }
}

class ClientFingerprinter {
  constructor(options = {}) {
    this.logger = options.logger || console;
  }

  /**
   * Genera una huella digital única para el cliente
   * @param {Object} req - Objeto de solicitud
   * @returns {Object} - Huella digital del cliente
   */
  generate(req) {
    return {
      ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
          req.headers['x-real-ip'] ||
          req.connection.remoteAddress ||
          req.socket.remoteAddress ||
          (req.connection?.socket ? req.connection.socket.remoteAddress : 'unknown'),
      userAgent: req.headers['user-agent'] || '',
      acceptLanguage: req.headers['accept-language'] || '',
      acceptEncoding: req.headers['accept-encoding'] || '',
      accept: req.headers['accept'] || '',
      referer: req.headers['referer'] || '',
      contentType: req.headers['content-type'] || '',
      timestamp: Date.now()
    };
  }
}

class Firewall {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.blockedIPs = new Map(); // Map<IP, { blockedUntil, reason, attempts }>
    this.maxAttempts = options.maxAttempts || 5;
    this.blockDuration = options.blockDuration || 900000; // 15 minutos
    this.whitelist = options.whitelist || []; // IPs que no deben ser bloqueadas
    this.blacklist = options.blacklist || []; // IPs que siempre deben ser bloqueadas
    this.rules = options.rules || []; // Reglas personalizadas de firewall
  }

  /**
   * Verifica si una IP está bloqueada
   * @param {string} ip - IP a verificar
   * @returns {Object} - Información del bloqueo
   */
  isBlocked(ip) {
    // Verificar si está en la blacklist
    if (this.blacklist.includes(ip)) {
      return {
        blocked: true,
        reason: 'IP en lista negra',
        permanent: true,
        blockedUntil: null
      };
    }

    // Verificar si está en la whitelist
    if (this.whitelist.includes(ip)) {
      return { blocked: false };
    }

    const blockInfo = this.blockedIPs.get(ip);
    if (!blockInfo) {
      return { blocked: false };
    }

    // Verificar si el bloqueo ha expirado
    if (Date.now() > blockInfo.blockedUntil) {
      this.blockedIPs.delete(ip); // Limpiar bloqueo expirado
      return { blocked: false };
    }

    return {
      blocked: true,
      reason: blockInfo.reason,
      blockedUntil: blockInfo.blockedUntil,
      attempts: blockInfo.attempts
    };
  }

  /**
   * Bloquea una IP
   * @param {string} ip - IP a bloquear
   * @param {string} reason - Razón del bloqueo
   */
  blockIP(ip, reason) {
    if (this.whitelist.includes(ip)) {
      this.logger.info(`IP ${ip} está en la whitelist, no se bloqueará`);
      return false;
    }

    const blockedUntil = Date.now() + this.blockDuration;
    const currentInfo = this.blockedIPs.get(ip);
    const attempts = currentInfo ? currentInfo.attempts + 1 : 1;

    this.blockedIPs.set(ip, {
      blockedUntil,
      reason,
      attempts
    });

    this.logger.warn(`IP ${ip} bloqueada por: ${reason}. Intentos: ${attempts}`);
    return true;
  }

  /**
   * Incrementa el contador de intentos fallidos para una IP
   * @param {string} ip - IP a incrementar intentos
   * @param {string} reason - Razón del intento fallido
   */
  incrementFailedAttempts(ip, reason) {
    if (this.whitelist.includes(ip)) {
      return;
    }

    const currentInfo = this.blockedIPs.get(ip);
    const attempts = currentInfo ? currentInfo.attempts + 1 : 1;
    const blockedUntil = currentInfo ? currentInfo.blockedUntil : Date.now() + this.blockDuration;

    this.blockedIPs.set(ip, {
      blockedUntil,
      reason,
      attempts
    });

    // Si se alcanza el límite de intentos, bloquear permanentemente
    if (attempts >= this.maxAttempts) {
      this.logger.warn(`IP ${ip} bloqueada permanentemente tras ${attempts} intentos fallidos`);
    }
  }

  /**
   * Agrega una regla personalizada de firewall
   * @param {string} name - Nombre de la regla
   * @param {Function} condition - Condición que evalúa la solicitud
   * @param {string} action - Acción a tomar ('block', 'monitor', etc.)
   * @param {string} reason - Razón para la acción
   */
  addRule(name, condition, action = 'block', reason = 'Violación de regla personalizada') {
    this.rules.push({ name, condition, action, reason });
    this.logger.info(`Regla de firewall agregada: ${name}`);
  }

  /**
   * Verifica si una solicitud coincide con alguna regla de firewall
   * @param {Object} req - Objeto de solicitud
   * @returns {Object|null} - Regla que coincide o null si ninguna
   */
  checkRules(req) {
    const clientIP = this.getClientIP(req);

    // Verificar reglas personalizadas
    for (const rule of this.rules) {
      if (rule.condition(req, clientIP)) {
        return {
          matched: true,
          rule: rule.name,
          action: rule.action || 'block',
          reason: rule.reason || 'Violación de regla de firewall'
        };
      }
    }

    return null;
  }

  /**
   * Obtiene la IP del cliente
   * @param {Object} req - Objeto de solicitud
   * @returns {string} - IP del cliente
   */
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           (req.connection?.socket ? req.connection.socket.remoteAddress : 'unknown');
  }
}

module.exports = SecurityEnhancedServer;