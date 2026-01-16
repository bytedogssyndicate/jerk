/**
 * Middleware de CORS para el framework API SDK
 * Implementación del componente middleware/cors.js
 */

class Cors {
  /**
   * Constructor del middleware CORS
   * @param {Object} options - Opciones de configuración de CORS
   * @param {Array|string} options.origin - Orígenes permitidos
   * @param {Array} options.methods - Métodos HTTP permitidos
   * @param {Array} options.allowedHeaders - Headers permitidos
   * @param {Array} options.exposedHeaders - Headers expuestos al cliente
   * @param {boolean} options.credentials - Permitir credenciales
   * @param {number} options.maxAge - Tiempo máximo para preflight cache
   */
  constructor(options = {}) {
    this.options = {
      origin: options.origin || '*',
      methods: options.methods || ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      allowedHeaders: options.allowedHeaders || [
        'Authorization',
        'Content-Type',
        'Accept',
        'X-Requested-With',
        'Access-Control-Allow-Origin'
      ],
      exposedHeaders: options.exposedHeaders || [],
      credentials: options.credentials !== undefined ? options.credentials : false,
      maxAge: options.maxAge || 86400 // 24 hours
    };

    // Convertir métodos a mayúsculas
    this.options.methods = this.options.methods.map(method => method.toUpperCase());
  }

  /**
   * Middleware de CORS
   * @returns {Function} - Middleware de CORS
   */
  middleware() {
    return (req, res, next) => {
      // Determinar el origen permitido
      const origin = this.determineOrigin(req);

      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        // Si no está permitido y no es wildcard, no establecer encabezado
        if (this.options.origin !== '*') {
          res.setHeader('Access-Control-Allow-Origin', 'null');
        } else {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
      }

      // Métodos permitidos
      res.setHeader('Access-Control-Allow-Methods', this.options.methods.join(','));

      // Headers permitidos
      res.setHeader('Access-Control-Allow-Headers', this.options.allowedHeaders.join(','));

      // Headers expuestos
      if (this.options.exposedHeaders.length > 0) {
        res.setHeader('Access-Control-Expose-Headers', this.options.exposedHeaders.join(','));
      }

      // Credenciales
      if (this.options.credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      // Max age para preflight
      res.setHeader('Access-Control-Max-Age', this.options.maxAge);

      // Manejar solicitud preflight (OPTIONS)
      if (req.method === 'OPTIONS') {
        // Solo responder con 204 si el origen es válido o es wildcard
        if (origin || this.options.origin === '*') {
          res.writeHead(204); // No content
          res.end();
        } else {
          // Si el origen no es válido, responder con 403 o permitir que la solicitud continúe
          // para que otros middlewares o handlers puedan manejarla
          if (next) {
            next();
          }
        }
        return;
      }

      // Continuar con el siguiente middleware
      if (next) {
        next();
      }
    };
  }

  /**
   * Determina el origen permitido para la solicitud
   * @param {Object} req - Objeto de solicitud HTTP
   * @returns {string|boolean} - Origen permitido o falso si no está permitido
   */
  determineOrigin(req) {
    const requestOrigin = req.headers.origin;

    if (!requestOrigin) {
      return false;
    }

    // Si el origen es wildcard, permitir cualquier origen
    if (this.options.origin === '*') {
      return requestOrigin;
    }

    // Si es un string, comparar directamente
    if (typeof this.options.origin === 'string') {
      return requestOrigin === this.options.origin ? requestOrigin : false;
    }

    // Si es un array, verificar si está incluido
    if (Array.isArray(this.options.origin)) {
      return this.options.origin.includes(requestOrigin) ? requestOrigin : false;
    }

    // Si es una función, llamarla para determinar el origen
    if (typeof this.options.origin === 'function') {
      return this.options.origin(requestOrigin);
    }

    return false;
  }
}

module.exports = Cors;