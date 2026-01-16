/**
 * Sistema de logging para el framework API SDK
 * Implementación del componente utils/logger.js
 */

class Logger {
  /**
   * Constructor del logger
   * @param {Object} options - Opciones de configuración
   * @param {string} options.level - Nivel de log (debug, info, warn, error)
   * @param {boolean} options.timestamp - Incluir timestamp en los logs
   * @param {string} options.format - Formato de salida (simple, json)
   */
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.timestamp = options.timestamp !== false; // Por defecto true
    this.format = options.format || 'simple';
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
  }

  /**
   * Método para registrar un mensaje de nivel debug
   * @param {...any} args - Argumentos a loggear
   */
  debug(...args) {
    if (this.levels[this.level] <= this.levels.debug) {
      this._log('DEBUG', ...args);
    }
  }

  /**
   * Método para registrar un mensaje de nivel info
   * @param {...any} args - Argumentos a loggear
   */
  info(...args) {
    if (this.levels[this.level] <= this.levels.info) {
      this._log('INFO', ...args);
    }
  }

  /**
   * Método para registrar un mensaje de nivel warn
   * @param {...any} args - Argumentos a loggear
   */
  warn(...args) {
    if (this.levels[this.level] <= this.levels.warn) {
      this._log('WARN', ...args);
    }
  }

  /**
   * Método para registrar un mensaje de nivel error
   * @param {...any} args - Argumentos a loggear
   */
  error(...args) {
    if (this.levels[this.level] <= this.levels.error) {
      this._log('ERROR', ...args);
    }
  }

  /**
   * Método privado para escribir el log
   * @param {string} level - Nivel del log
   * @param {...any} args - Argumentos a loggear
   */
  _log(level, ...args) {
    const timestamp = this.timestamp ? new Date().toISOString() : '';
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2);
      }
      return String(arg);
    }).join(' ');

    if (this.format === 'json') {
      const logEntry = {
        timestamp,
        level,
        message
      };
      console.log(JSON.stringify(logEntry));
    } else {
      const prefix = timestamp ? `[${timestamp}] ${level}:` : `${level}:`;
      console.log(prefix, message);
    }
  }

  /**
   * Método para cambiar el nivel de log
   * @param {string} level - Nuevo nivel de log
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.level = level;
    } else {
      throw new Error(`Nivel de log inválido: ${level}. Niveles válidos: ${Object.keys(this.levels).join(', ')}`);
    }
  }

  /**
   * Método para crear un logger con contexto adicional
   * @param {Object} context - Contexto adicional para los logs
   * @returns {Logger} - Nueva instancia de Logger con contexto
   */
  withContext(context) {
    const logger = new Logger({
      level: this.level,
      timestamp: this.timestamp,
      format: this.format
    });

    // Sobrescribir el método _log para incluir contexto
    logger._log = (level, ...args) => {
      const timestamp = this.timestamp ? new Date().toISOString() : '';
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg, null, 2);
        }
        return String(arg);
      }).join(' ');

      if (this.format === 'json') {
        const logEntry = {
          timestamp,
          level,
          context,
          message
        };
        console.log(JSON.stringify(logEntry));
      } else {
        const prefix = timestamp ? `[${timestamp}] ${level}:` : `${level}:`;
        console.log(prefix, `[${JSON.stringify(context)}]`, message);
      }
    };

    return logger;
  }
}

module.exports = { Logger };