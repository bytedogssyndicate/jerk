/**
 * Middleware de Rate Limiting para el framework API SDK
 * Implementación del componente middleware/rateLimiter.js
 */

class RateLimiter {
  /**
   * Constructor del limitador de tasa
   * @param {Object} options - Opciones de configuración
   * @param {number} options.windowMs - Ventana de tiempo en milisegundos
   * @param {number} options.maxRequests - Número máximo de solicitudes permitidas en la ventana
   * @param {string} options.store - Tipo de almacenamiento ('memory', 'redis')
   * @param {Object} options.redisClient - Cliente Redis (si se usa almacenamiento Redis)
   */
  constructor(options = {}) {
    this.windowMs = options.windowMs || 900000; // 15 minutos por defecto
    this.maxRequests = options.maxRequests || 100; // 100 solicitudes por defecto
    this.store = options.store || 'memory';
    this.redisClient = options.redisClient;
    
    // Almacenamiento en memoria si no se especifica Redis
    this.memoryStore = new Map();
    
    // Si se especifica Redis, verificar que el cliente esté presente
    if (this.store === 'redis' && !this.redisClient) {
      throw new Error('Se requiere un cliente Redis cuando se usa almacenamiento Redis');
    }
  }

  /**
   * Middleware de limitación de tasa
   * @returns {Function} - Middleware de rate limiting
   */
  middleware() {
    return async (req, res, next) => {
      // Obtener identificador único para el cliente (puede ser IP o token de usuario)
      const clientId = this.getClientIdentifier(req);
      
      // Obtener el conteo actual de solicitudes para este cliente
      const currentCount = await this.getRequestCount(clientId);
      
      // Incrementar el conteo de solicitudes
      await this.incrementRequestCount(clientId);
      
      // Verificar si se ha superado el límite
      if (currentCount >= this.maxRequests) {
        // Calcular tiempo restante para resetear el límite
        const timeLeft = await this.getTimeUntilReset(clientId);
        
        // Establecer headers de rate limiting
        res.setHeader('X-RateLimit-Limit', this.maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.floor(timeLeft / 1000)); // En segundos
        
        // Devolver error 429 (Too Many Requests)
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Límite de solicitudes excedido', 
          retryAfter: Math.floor(timeLeft / 1000) + ' segundos'
        }));
        
        return;
      }
      
      // Establecer headers de rate limiting
      const remaining = this.maxRequests - currentCount - 1;
      const timeLeft = await this.getTimeUntilReset(clientId);
      
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.floor(timeLeft / 1000)); // En segundos
      
      // Continuar con el siguiente middleware
      if (next) {
        next();
      }
    };
  }

  /**
   * Obtiene el identificador único para el cliente
   * @param {Object} req - Objeto de solicitud HTTP
   * @returns {string} - Identificador único del cliente
   */
  getClientIdentifier(req) {
    // Prioridad: 1. Token de usuario, 2. Cabecera X-Forwarded-For, 3. IP remota
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      // Tomar la primera IP si hay múltiples
      return forwarded.split(',')[0].trim();
    }
    
    return req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           (req.connection.socket ? req.connection.socket.remoteAddress : 'unknown');
  }

  /**
   * Obtiene el conteo actual de solicitudes para un cliente
   * @param {string} clientId - Identificador del cliente
   * @returns {Promise<number>} - Número actual de solicitudes
   */
  async getRequestCount(clientId) {
    if (this.store === 'redis') {
      // Usar Redis para obtener el conteo
      const key = `rate_limit:${clientId}`;
      const count = await this.redisClient.get(key);
      return count ? parseInt(count, 10) : 0;
    } else {
      // Usar almacenamiento en memoria
      const entry = this.memoryStore.get(clientId);
      if (!entry) {
        return 0;
      }
      
      // Verificar si el tiempo de la entrada ha expirado
      if (Date.now() - entry.startTime > this.windowMs) {
        // La entrada ha expirado, eliminarla y retornar 0
        this.memoryStore.delete(clientId);
        return 0;
      }
      
      return entry.count;
    }
  }

  /**
   * Incrementa el conteo de solicitudes para un cliente
   * @param {string} clientId - Identificador del cliente
   * @returns {Promise<void>}
   */
  async incrementRequestCount(clientId) {
    if (this.store === 'redis') {
      // Usar Redis para incrementar el conteo
      const key = `rate_limit:${clientId}`;
      const count = await this.redisClient.incr(key);
      
      // Establecer expiración para la clave
      await this.redisClient.expire(key, Math.ceil(this.windowMs / 1000));
    } else {
      // Usar almacenamiento en memoria
      const entry = this.memoryStore.get(clientId);
      const now = Date.now();
      
      if (!entry) {
        // Crear nueva entrada
        this.memoryStore.set(clientId, {
          count: 1,
          startTime: now
        });
      } else {
        // Verificar si el tiempo ha expirado
        if (now - entry.startTime > this.windowMs) {
          // Reiniciar el conteo
          this.memoryStore.set(clientId, {
            count: 1,
            startTime: now
          });
        } else {
          // Incrementar el conteo
          entry.count++;
          entry.startTime = entry.startTime; // Mantener el tiempo de inicio
        }
      }
    }
  }

  /**
   * Obtiene el tiempo restante hasta que se resetee el conteo de solicitudes
   * @param {string} clientId - Identificador del cliente
   * @returns {Promise<number>} - Tiempo restante en milisegundos
   */
  async getTimeUntilReset(clientId) {
    if (this.store === 'redis') {
      // En Redis, obtenemos el TTL restante
      const key = `rate_limit:${clientId}`;
      const ttl = await this.redisClient.ttl(key);
      return ttl > 0 ? ttl * 1000 : this.windowMs;
    } else {
      // En memoria, calcular el tiempo restante
      const entry = this.memoryStore.get(clientId);
      if (!entry) {
        return this.windowMs;
      }
      
      const elapsed = Date.now() - entry.startTime;
      return Math.max(0, this.windowMs - elapsed);
    }
  }
  
  /**
   * Reinicia el conteo de solicitudes para un cliente
   * @param {string} clientId - Identificador del cliente
   * @returns {Promise<void>}
   */
  async reset(clientId) {
    if (this.store === 'redis') {
      const key = `rate_limit:${clientId}`;
      await this.redisClient.del(key);
    } else {
      this.memoryStore.delete(clientId);
    }
  }
}

module.exports = RateLimiter;