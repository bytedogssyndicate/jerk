/**
 * Middleware de Firewall para el framework JERK
 * Implementación del componente middleware/firewall.js
 */

class Firewall {
  /**
   * Constructor del firewall
   * @param {Object} options - Opciones de configuración
   * @param {number} options.maxAttempts - Número máximo de intentos fallidos antes de bloquear
   * @param {number} options.blockDuration - Duración del bloqueo en milisegundos
   * @param {Array} options.whitelist - IPs que no deben ser bloqueadas
   * @param {Array} options.blacklist - IPs que siempre deben ser bloqueadas
   * @param {Array} options.rules - Reglas personalizadas de firewall
   * @param {Object} options.logger - Instancia de logger para eventos de seguridad
   */
  constructor(options = {}) {
    this.blockedIPs = new Map(); // Map<IP, { blockedUntil, reason, attempts }>
    this.maxAttempts = options.maxAttempts || 5;
    this.blockDuration = options.blockDuration || 900000; // 15 minutos por defecto
    this.logger = options.logger || console;
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
   * @returns {boolean} - True si la IP fue bloqueada
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

    // Verificar patrones comunes de ataque
    const path = req.url;
    const body = req.body || '';
    const headers = req.headers;

    // SQL Injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /('|--|#|\/\*|\*\/|;)/g
    ];

    // XSS patterns
    const xssPatterns = [
      /(<script|javascript:|vbscript:|onload|onerror|onmouseover|onclick|onfocus|onblur)/gi,
      /(src|href)=["']javascript:/gi,
      /<iframe/gi,
      /<img[^>]*src[\\s]*=[\\s]*["'][\\s]*(javascript:|data:)/gi
    ];

    // Path traversal
    const pathTraversal = /\.\.\//g;

    // Verificar patrones en URL
    for (const pattern of sqlPatterns) {
      if (pattern.test(path)) {
        return {
          matched: true,
          rule: 'sql_injection',
          action: 'block',
          reason: 'Patrón de SQL Injection detectado'
        };
      }
    }

    for (const pattern of xssPatterns) {
      if (pattern.test(path)) {
        return {
          matched: true,
          rule: 'xss_attack',
          action: 'block',
          reason: 'Patrón de XSS detectado'
        };
      }
    }

    if (pathTraversal.test(path)) {
      return {
        matched: true,
        rule: 'path_traversal',
        action: 'block',
        reason: 'Patrón de Path Traversal detectado'
      };
    }

    // Verificar patrones en body si es string
    if (typeof body === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(body)) {
          return {
            matched: true,
            rule: 'sql_injection_body',
            action: 'block',
            reason: 'Patrón de SQL Injection en body detectado'
          };
        }
      }

      for (const pattern of xssPatterns) {
        if (pattern.test(body)) {
          return {
            matched: true,
            rule: 'xss_attack_body',
            action: 'block',
            reason: 'Patrón de XSS en body detectado'
          };
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
      return {
        matched: true,
        rule: 'suspicious_headers',
        action: 'monitor',
        reason: 'Cantidad sospechosa de headers de proxy detectados'
      };
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

  /**
   * Agrega una IP a la lista blanca
   * @param {string} ip - IP a agregar a la lista blanca
   */
  addToWhitelist(ip) {
    if (!this.whitelist.includes(ip)) {
      this.whitelist.push(ip);
      this.logger.info(`IP ${ip} agregada a la whitelist`);

      // Disparar hook
      const hooks = require('../../index.js').hooks;
      if (hooks) {
        hooks.doAction('firewall_whitelist_updated', ip, 'added', this.whitelist);
      }
    }
  }

  /**
   * Remueve una IP de la lista blanca
   * @param {string} ip - IP a remover de la lista blanca
   */
  removeFromWhitelist(ip) {
    const index = this.whitelist.indexOf(ip);
    if (index !== -1) {
      this.whitelist.splice(index, 1);
      this.logger.info(`IP ${ip} removida de la whitelist`);

      // Disparar hook
      const hooks = require('../../index.js').hooks;
      if (hooks) {
        hooks.doAction('firewall_whitelist_updated', ip, 'removed', this.whitelist);
      }
    }
  }

  /**
   * Agrega una IP a la lista negra
   * @param {string} ip - IP a agregar a la lista negra
   * @param {string} reason - Razón del bloqueo
   */
  addToBlacklist(ip, reason = 'Agregada a la blacklist manualmente') {
    if (!this.blacklist.includes(ip)) {
      this.blacklist.push(ip);
      this.logger.info(`IP ${ip} agregada a la blacklist: ${reason}`);

      // Disparar hook
      const hooks = require('../../index.js').hooks;
      if (hooks) {
        hooks.doAction('firewall_blacklist_updated', ip, 'added', this.blacklist);
      }
    }
  }

  /**
   * Remueve una IP de la lista negra
   * @param {string} ip - IP a remover de la lista negra
   */
  removeFromBlacklist(ip) {
    const index = this.blacklist.indexOf(ip);
    if (index !== -1) {
      this.blacklist.splice(index, 1);
      this.logger.info(`IP ${ip} removida de la blacklist`);

      // Disparar hook
      const hooks = require('../../index.js').hooks;
      if (hooks) {
        hooks.doAction('firewall_blacklist_updated', ip, 'removed', this.blacklist);
      }
    }
  }

  /**
   * Obtiene el estado actual del firewall
   * @returns {Object} - Estado del firewall
   */
  getStatus() {
    return {
      blockedIPs: Array.from(this.blockedIPs.entries()).map(([ip, info]) => ({
        ip,
        blockedUntil: info.blockedUntil,
        reason: info.reason,
        attempts: info.attempts
      })),
      whitelist: [...this.whitelist],
      blacklist: [...this.blacklist],
      totalBlocked: this.blockedIPs.size,
      rules: this.rules.map(rule => ({ name: rule.name, action: rule.action }))
    };
  }

  /**
   * Middleware de firewall
   * @returns {Function} - Middleware de firewall
   */
  middleware() {
    return (req, res, next) => {
      // Disparar hook antes de procesar la solicitud
      const hooks = require('../../index.js').hooks;
      if (hooks) {
        hooks.doAction('firewall_request_received', req, res);
      }

      const clientIP = this.getClientIP(req);

      // Verificar si la IP está bloqueada
      const blockInfo = this.isBlocked(clientIP);
      if (blockInfo.blocked) {
        this.logger.warn(`Solicitud bloqueada desde IP: ${clientIP}, razón: ${blockInfo.reason}`);

        // Disparar hook de evento de seguridad
        if (hooks) {
          hooks.doAction('firewall_ip_blocked', clientIP, blockInfo.reason, req, res);
        }

        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Acceso denegado por firewall',
          reason: blockInfo.reason,
          blockedUntil: blockInfo.blockedUntil
        }));
        return;
      }

      // Verificar reglas de firewall
      const ruleMatch = this.checkRules(req);
      if (ruleMatch) {
        // Disparar hook de evento de regla activada
        if (hooks) {
          hooks.doAction('firewall_rule_triggered', ruleMatch, clientIP, req);
        }

        if (ruleMatch.action === 'block') {
          this.logger.warn(`Solicitud bloqueada por regla: ${ruleMatch.rule}, IP: ${clientIP}, razón: ${ruleMatch.reason}`);

          // Incrementar intentos fallidos
          this.incrementFailedAttempts(clientIP, ruleMatch.reason);

          // Disparar hook de evento de bloqueo
          if (hooks) {
            hooks.doAction('firewall_request_blocked', ruleMatch, clientIP, req, res);
          }

          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Solicitud bloqueada por firewall',
            reason: ruleMatch.reason,
            rule: ruleMatch.rule
          }));
          return;
        } else if (ruleMatch.action === 'monitor') {
          this.logger.info(`Solicitud monitoreada por regla: ${ruleMatch.rule}, IP: ${clientIP}, razón: ${ruleMatch.reason}`);

          // Disparar hook de evento de monitoreo
          if (hooks) {
            hooks.doAction('firewall_request_monitored', ruleMatch, clientIP, req);
          }
        }
      }

      // Disparar hook antes de continuar con el siguiente middleware
      if (hooks) {
        hooks.doAction('firewall_request_allowed', req, res);
      }

      // Continuar con el siguiente middleware
      next();
    };
  }
}

module.exports = Firewall;