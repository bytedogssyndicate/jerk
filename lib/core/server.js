/**
 * Servidor HTTP básico para el framework API SDK
 * Implementación del componente core/server.js
 */

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const { Logger } = require('../utils/logger');

class APIServer {
  /**
   * Constructor del servidor
   * @param {Object} options - Opciones de configuración del servidor
   * @param {number} options.port - Puerto donde escuchará el servidor
   * @param {string} options.host - Host donde escuchará el servidor
   * @param {boolean} options.https - Habilitar servidor HTTPS
   * @param {string} options.key - Ruta al archivo de clave privada para HTTPS
   * @param {string} options.cert - Ruta al archivo de certificado para HTTPS
   * @param {number} options.requestTimeout - Timeout para solicitudes en milisegundos
   * @param {number} options.connectionTimeout - Timeout para conexiones en milisegundos
   */
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.host = options.host || 'localhost';
    this.https = options.https || false;
    this.httpsOptions = {};

    if (options.key && options.cert) {
      this.httpsOptions = {
        key: fs.readFileSync(options.key),
        cert: fs.readFileSync(options.cert)
      };
    }

    this.requestTimeout = options.requestTimeout || 120000; // 2 minutos por defecto
    this.connectionTimeout = options.connectionTimeout || 120000; // 2 minutos por defecto
    this.maxBodySize = options.maxBodySize || 10 * 1024 * 1024; // 10MB por defecto

    this.routes = [];
    this.middlewares = [];
    this.logger = new Logger();
    this.server = null;
  }

  /**
   * Método para agregar una ruta al servidor
   * @param {string} method - Método HTTP (GET, POST, PUT, DELETE, etc.)
   * @param {string} path - Ruta del endpoint
   * @param {Function} handler - Función manejadora de la ruta
   */
  addRoute(method, path, handler) {
    this.routes.push({
      method: method.toUpperCase(),
      path,
      handler
    });
  }

  /**
   * Método para agregar middleware
   * @param {Function} middleware - Función de middleware
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Método para encontrar una ruta coincidente
   * @param {string} method - Método HTTP
   * @param {string} pathname - Ruta a buscar
   * @returns {Object|null} - Objeto de ruta encontrado o null
   */
  findRoute(method, pathname) {
    // Buscar ruta exacta primero
    const exactMatch = this.routes.find(route => 
      route.method === method && route.path === pathname
    );

    if (exactMatch) {
      return {
        route: exactMatch,
        params: {}
      };
    }

    // Buscar rutas parametrizadas
    for (const route of this.routes) {
      if (route.method !== method) continue;

      // Convertir ruta parametrizada a expresión regular
      const routeRegex = this.pathToRegex(route.path);
      const match = pathname.match(routeRegex);

      if (match) {
        const params = this.extractParams(route.path, pathname);
        return {
          route: route,
          params
        };
      }
    }

    return null;
  }

  /**
   * Convierte una ruta con parámetros a expresión regular
   * @param {string} path - Ruta con posibles parámetros
   * @returns {RegExp} - Expresión regular para la ruta
   */
  pathToRegex(path) {
    // Escapar caracteres especiales de la ruta, excepto los parámetros
    // Pero dejar : sin escapar ya que lo usaremos para identificar parámetros
    let escapedPath = '';
    for (let i = 0; i < path.length; i++) {
      const char = path[i];
      if (char.match(/[.+?^${}()|[\]\\]/) && !(i > 0 && path[i-1] === ':')) {
        escapedPath += '\\' + char;
      } else {
        escapedPath += char;
      }
    }
    // Reemplazar parámetros :param con grupos de captura no greedy para evitar problemas de matching
    const regexPath = escapedPath.replace(/:([a-zA-Z0-9_]+)/g, '([^/]+?)');
    return new RegExp(`^${regexPath}$`);
  }

  /**
   * Extrae los parámetros de una ruta parametrizada
   * @param {string} routePath - Ruta con parámetros (ej. /users/:id)
   * @param {string} actualPath - Ruta real solicitada
   * @returns {Object} - Objeto con los parámetros extraídos
   */
  extractParams(routePath, actualPath) {
    const params = {};

    // Expresión regular para encontrar parámetros en la ruta
    const paramNames = [];
    const paramNameRegex = /:([a-zA-Z0-9_]+)/g;
    let match;

    while ((match = paramNameRegex.exec(routePath)) !== null) {
      paramNames.push(match[1]);
    }

    // Crear expresión regular para extraer valores
    const routeRegex = this.pathToRegex(routePath);
    const values = actualPath.match(routeRegex);

    if (values) {
      // El primer elemento es la cadena completa, los demás son los valores capturados
      for (let i = 0; i < paramNames.length; i++) {
        if (values[i + 1]) {
          params[paramNames[i]] = values[i + 1];
        }
      }
    }

    return params;
  }

  /**
   * Inicia el servidor
   */
  start() {
    // Disparar hook antes de iniciar el servidor
    const hooks = require('../../index.js').hooks;
    if (hooks) {
      hooks.doAction('pre_server_start', this);
    }

    if (this.https && Object.keys(this.httpsOptions).length > 0) {
      this.server = https.createServer(this.httpsOptions, this.handleRequest.bind(this));
    } else {
      this.server = http.createServer(this.handleRequest.bind(this));
    }

    // Configurar timeouts
    this.server.setTimeout(this.requestTimeout);
    this.server.on('timeout', (socket) => {
      this.logger.warn('Conexión expirada por timeout');
      socket.end();
    });

    this.server.on('connection', (socket) => {
      // Configurar timeout de conexión
      socket.setTimeout(this.connectionTimeout);
      socket.on('timeout', () => {
        this.logger.warn('Socket expirado por timeout');
        socket.destroy();
      });
    });

    this.server.listen(this.port, this.host, () => {
      if (this.https && Object.keys(this.httpsOptions).length > 0) {
        this.logger.info(`Servidor iniciado en https://${this.host}:${this.port}`);
      } else {
        this.logger.info(`Servidor iniciado en http://${this.host}:${this.port}`);
      }

      // Disparar hook después de iniciar el servidor
      if (hooks) {
        hooks.doAction('post_server_start', this);
      }
    });

    return this.server;
  }

  /**
   * Detiene el servidor
   */
  stop() {
    if (this.server) {
      this.server.close(() => {
        this.logger.info('Servidor detenido');
      });
    }
  }

  /**
   * Maneja las solicitudes entrantes
   * @param {Object} req - Objeto de solicitud HTTP
   * @param {Object} res - Objeto de respuesta HTTP
   */
  async handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;

    // Agregar propiedades útiles a la solicitud
    req.query = query;
    req.params = {};
    req.body = '';

    // Configurar límite de tamaño para el cuerpo de la solicitud desde configuración
    let bodySize = 0;

    // Capturar cuerpo de la solicitud con límite de tamaño
    req.on('data', chunk => {
      bodySize += chunk.length;
      if (bodySize > this.maxBodySize) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Solicitud demasiado grande', details: `El cuerpo de la solicitud excede el límite permitido de ${this.maxBodySize} bytes` }));
        req.destroy(); // Terminar la conexión
        return;
      }
      req.body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        // Parsear body si es JSON
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
          try {
            req.body = JSON.parse(req.body);
          } catch (e) {
            req.body = {};
          }
        }

        // Verificar si es una solicitud OPTIONS preflight
        // Si lo es, podríamos tener un middleware especial para manejarla
        if (req.method === 'OPTIONS') {
          // Ejecutar middlewares para manejar la solicitud OPTIONS (como CORS)
          for (const middleware of this.middlewares) {
            // Verificar si el middleware es una función antes de ejecutarla
            if (typeof middleware === 'function') {
              // Verificar si el middleware tiene firma (req, res, next)
              if (middleware.length === 3) {
                // Middleware con next
                await new Promise((resolve, reject) => {
                  const next = (err) => {
                    if (err) {
                      reject(err);
                    } else {
                      resolve();
                    }
                  };
                  const result = middleware(req, res, next);
                  // Si el middleware devuelve una promesa, esperarla
                  if (result && typeof result.then === 'function') {
                    result.then(resolve).catch(reject);
                  }
                });
              } else {
                // Middleware sin next
                await middleware(req, res);
              }

              if (res.finished) return; // Si el middleware respondió, salir
            }
          }

          // Si después de ejecutar los middlewares la respuesta no se ha terminado,
          // buscar una ruta específica o manejar como preflight genérico
          const matchedRoute = this.findRoute(req.method, pathname);
          if (matchedRoute) {
            // Agregar parámetros a la solicitud
            req.params = matchedRoute.params;
            // Ejecutar handler de la ruta
            await matchedRoute.route.handler(req, res);
          } else {
            // Para solicitudes OPTIONS que no tienen un handler específico,
            // pero ya fueron manejadas por el middleware CORS, simplemente terminar
            if (!res.finished) {
              // Si no hay ruta específica para OPTIONS pero el middleware no respondió,
              // devolver 204 para cumplir con CORS preflight
              res.writeHead(204);
              res.end();
            }
          }
        } else {
          // Para otros métodos, seguir la lógica original
          const matchedRoute = this.findRoute(req.method, pathname);

          if (matchedRoute) {
            // Agregar parámetros a la solicitud
            req.params = matchedRoute.params;

            // Ejecutar middlewares
            for (const middleware of this.middlewares) {
              // Verificar si el middleware es una función antes de ejecutarla
              if (typeof middleware === 'function') {
                // Verificar si el middleware tiene firma (req, res, next)
                if (middleware.length === 3) {
                  // Middleware con next
                  await new Promise((resolve, reject) => {
                    const next = (err) => {
                      if (err) {
                        reject(err);
                      } else {
                        resolve();
                      }
                    };
                    const result = middleware(req, res, next);
                    // Si el middleware devuelve una promesa, esperarla
                    if (result && typeof result.then === 'function') {
                      result.then(resolve).catch(reject);
                    }
                  });
                } else {
                  // Middleware sin next
                  await middleware(req, res);
                }

                if (res.finished) return; // Si el middleware respondió, salir
              }
            }

            // Ejecutar handler de la ruta
            await matchedRoute.route.handler(req, res);
          } else {
            // Ruta no encontrada
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Ruta no encontrada', path: pathname }));
          }
        }
      } catch (error) {
        this.logger.error('Error procesando la solicitud:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error interno del servidor', details: error.message }));
      }
    });
  }
}

module.exports = APIServer;