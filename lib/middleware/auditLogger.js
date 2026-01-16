/**
 * Middleware de auditoría para el API SDK Framework
 * Componente: lib/middleware/auditLogger.js
 */

const fs = require('fs');
const path = require('path');

class AuditLogger {
  /**
   * Constructor del middleware de auditoría
   * @param {Object} options - Opciones de configuración
   * @param {string} options.logFile - Ruta al archivo de logs
   * @param {Array} options.events - Eventos a auditar ['request', 'response', 'error']
   * @param {Function} options.filter - Función para filtrar solicitudes
   * @param {boolean} options.includeBody - Incluir cuerpo de la solicitud
   * @param {boolean} options.includeHeaders - Incluir headers
   * @param {Object} options.logger - Logger externo opcional
   */
  constructor(options = {}) {
    this.logFile = options.logFile || './audit.log';
    this.events = options.events || ['request', 'response', 'error'];
    this.filter = options.filter || (() => true);
    this.includeBody = options.includeBody !== false;
    this.includeHeaders = options.includeHeaders !== false;
    this.logger = options.logger || console;
    
    // Asegurar que el directorio del log existe
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
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
      
      // Registrar la solicitud entrante si está habilitado
      if (this.events.includes('request')) {
        this.logRequest(req, requestId);
      }
      
      // Capturar la respuesta original para registrarla
      const originalEnd = res.end;
      res.end = (chunk, encoding) => {
        const duration = Date.now() - startTime;
        
        // Registrar la respuesta si está habilitado
        if (this.events.includes('response')) {
          this.logResponse(req, res, chunk, duration, requestId);
        }
        
        // Llamar al método original
        originalEnd.call(res, chunk, encoding);
      };

      // Capturar errores para auditarlos
      const originalOnError = req.connection && req.connection.onerror;
      req.connection.onerror = (err) => {
        if (this.events.includes('error')) {
          this.logError(req, err, requestId);
        }
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
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'response',
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: this.getClientIP(req),
      responseSize: chunk ? Buffer.byteLength(typeof chunk === 'string' ? chunk : JSON.stringify(chunk)) : 0
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
           (req.connection?.socket ? req.connection.socket.remoteAddress : null) || 
           'unknown';
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
    try {
      const stats = fs.statSync(this.logFile);
      const now = new Date();
      const fileDate = new Date(stats.mtime);
      const diffTime = Math.abs(now - fileDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > days) {
        fs.unlinkSync(this.logFile);
        console.log(`Archivo de log eliminado por antigüedad: ${this.logFile}`);
      }
    } catch (error) {
      // El archivo puede no existir
      console.log(`No se pudo limpiar el archivo de log: ${error.message}`);
    }
  }
}

module.exports = AuditLogger;