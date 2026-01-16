/**
 * Carga de rutas desde archivos JSON para el framework API SDK
 * Implementación del componente loader/routeLoader.js
 */

const fs = require('fs');
const path = require('path');

class RouteLoader {
  /**
   * Constructor del cargador de rutas
   */
  constructor() {
    this.loadedRoutes = [];
  }

  /**
   * Método para cargar rutas desde un archivo JSON
   * @param {Object} server - Instancia del servidor
   * @param {string} filePath - Ruta al archivo JSON de rutas
   * @returns {Promise<Array>} - Array de rutas cargadas
   */
  async loadRoutes(server, filePath) {
    try {
      // Disparar hook antes de cargar rutas
      const hooks = require('../../index.js').hooks;
      if (hooks) {
        hooks.doAction('pre_route_load', filePath, server);
      }

      // Verificar si el archivo existe
      if (!fs.existsSync(filePath)) {
        throw new Error(`Archivo de rutas no encontrado: ${filePath}`);
      }

      // Leer y parsear el archivo JSON
      const routeData = fs.readFileSync(filePath, 'utf8');
      const routes = JSON.parse(routeData);

      // Validar estructura del archivo de rutas
      this.validateRoutesStructure(routes);

      // Cargar cada ruta
      for (const route of routes) {
        await this.loadSingleRoute(server, route);
      }

      this.loadedRoutes = [...this.loadedRoutes, ...routes];

      // Disparar hook después de cargar rutas
      if (hooks) {
        hooks.doAction('post_route_load', routes, server);
      }

      return routes;
    } catch (error) {
      throw new Error(`Error cargando rutas desde ${filePath}: ${error.message}`);
    }
  }

  /**
   * Método para validar la estructura del archivo de rutas
   * @param {Array} routes - Array de rutas a validar
   */
  validateRoutesStructure(routes) {
    if (!Array.isArray(routes)) {
      throw new Error('El archivo de rutas debe contener un array de rutas');
    }

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];

      if (typeof route !== 'object' || route === null) {
        throw new Error(`La ruta en la posición ${i} no es un objeto válido`);
      }

      if (!route.path) {
        throw new Error(`La ruta en la posición ${i} no tiene propiedad 'path'`);
      }

      if (!route.method) {
        throw new Error(`La ruta en la posición ${i} no tiene propiedad 'method'`);
      }

      if (!route.controller) {
        throw new Error(`La ruta en la posición ${i} no tiene propiedad 'controller'`);
      }

      if (!route.handler) {
        throw new Error(`La ruta en la posición ${i} no tiene propiedad 'handler'`);
      }

      // Validar que el content-type sea un string si está presente
      if (route.contentType && typeof route.contentType !== 'string') {
        throw new Error(`La ruta en la posición ${i} tiene un 'contentType' inválido, debe ser un string`);
      }
    }
  }

  /**
   * Método para cargar una sola ruta
   * @param {Object} server - Instancia del servidor
   * @param {Object} route - Objeto de ruta a cargar
   */
  async loadSingleRoute(server, route) {
    // Obtener el controlador
    const controllerPath = path.resolve(process.cwd(), route.controller);
    let controllerModule;

    try {
      controllerModule = require(controllerPath);
    } catch (error) {
      throw new Error(`No se pudo cargar el controlador: ${route.controller}. Error: ${error.message}`);
    }

    // Obtener el handler del controlador
    const handler = controllerModule[route.handler];
    if (typeof handler !== 'function') {
      throw new Error(`El handler '${route.handler}' no es una función en el controlador: ${route.controller}`);
    }

    // Crear un handler que establezca el content-type si está especificado
    let finalHandler = handler;

    if (route.contentType) {
      finalHandler = async (req, res) => {
        // Establecer el content-type antes de ejecutar el handler original
        res.setHeader('Content-Type', route.contentType);

        // Si el handler es asíncrono, esperarlo
        if (handler.constructor.name === 'AsyncFunction') {
          await handler(req, res);
        } else {
          handler(req, res);
        }
      };
    }

    // Aplicar autenticación si está especificada
    if (route.auth && route.auth !== 'none') {
      // Verificar si es autenticación de sesión
      if (route.auth === 'session') {
        // Verificar si el servidor tiene sessionManager
        if (server.sessionManager) {
          // Importar el middleware de autenticación de sesión
          const { sessionAuth } = require('../middleware/session');
          const authMiddleware = sessionAuth(server.sessionManager, route.authOptions || {});

          // Crear un nuevo handler que ejecute la autenticación primero
          const authenticatedHandler = async (req, res) => {
            try {
              // Ejecutar el middleware de autenticación y esperar a que se resuelva
              await new Promise((resolve, reject) => {
                const next = () => resolve();
                const result = authMiddleware(req, res, next);

                // Si authMiddleware devuelve una promesa, esperarla
                if (result && typeof result.then === 'function') {
                  result.then(resolve).catch(reject);
                }
              });

              // Si la autenticación fue exitosa (no se envió respuesta aún), ejecutar el handler original
              if (!res.headersSent) {
                // Si el handler es asíncrono, esperarlo también
                if (finalHandler.constructor.name === 'AsyncFunction') {
                  await finalHandler(req, res);
                } else {
                  finalHandler(req, res);
                }
              }
            } catch (error) {
              console.error('Error en el manejo de autenticación de sesión:', error);
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error interno del servidor' }));
              }
            }
          };

          // Agregar la ruta con el handler autenticado
          server.addRoute(route.method, route.path, authenticatedHandler);
        } else {
          // Si no hay sessionManager en el servidor, agregar la ruta normalmente
          server.addRoute(route.method, route.path, finalHandler);
        }
      } else {
        // Usar el authenticator del servidor si está disponible para otros tipos de autenticación
        if (server.authenticator) {
          const authMiddleware = server.authenticator.authenticate(route.auth, route.authOptions || {});

          // Crear un nuevo handler que ejecute la autenticación primero
          const authenticatedHandler = async (req, res) => {
            try {
              // Ejecutar el middleware de autenticación y esperar a que se resuelva
              await new Promise((resolve, reject) => {
                const next = () => resolve();
                const result = authMiddleware(req, res, next);

                // Si authMiddleware devuelve una promesa, esperarla
                if (result && typeof result.then === 'function') {
                  result.then(resolve).catch(reject);
                }
              });

              // Si la autenticación fue exitosa (no se envió respuesta aún), ejecutar el handler original
              if (!res.headersSent) {
                // Si el handler es asíncrono, esperarlo también
                if (finalHandler.constructor.name === 'AsyncFunction') {
                  await finalHandler(req, res);
                } else {
                  finalHandler(req, res);
                }
              }
            } catch (error) {
              console.error('Error en el manejo de autenticación:', error);
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error interno del servidor' }));
              }
            }
          };

          // Agregar la ruta con el handler autenticado
          server.addRoute(route.method, route.path, authenticatedHandler);
        } else {
          // Si no hay authenticator en el servidor, agregar la ruta normalmente
          server.addRoute(route.method, route.path, finalHandler);
        }
      }
    } else {
      // Si no hay autenticación requerida, agregar la ruta normalmente
      server.addRoute(route.method, route.path, finalHandler);
    }
  }

  /**
   * Método para crear un middleware de autenticación para una ruta específica
   * @param {string} authType - Tipo de autenticación
   * @param {Object} options - Opciones para la autenticación
   * @returns {Function|null} - Middleware de autenticación o null
   */
  createAuthenticatorForRoute(authType, options = {}) {
    // Importar Authenticator dinámicamente para evitar dependencias circulares
    try {
      const Authenticator = require('../middleware/authenticator');
      const authenticator = new Authenticator();

      // Registrar estrategias predeterminadas
      if (!options.jwtSecret) {
        throw new Error('Se requiere un secreto JWT para la estrategia JWT');
      }
      authenticator.use('jwt', authenticator.jwtStrategy(options.jwtSecret));
      authenticator.use('apiKey', authenticator.apiKeyStrategy(
        options.apiKeyHeader || 'X-API-Key',
        options.apiKeyValues || []
      ));

      // Crear middleware de autenticación
      return authenticator.authenticate(authType, options);
    } catch (error) {
      console.error('Error creando middleware de autenticación:', error.message);
      return null;
    }
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
    // Reemplazar parámetros :param con grupos de captura
    const regexPath = escapedPath.replace(/:([a-zA-Z0-9_]+)/g, '([^/]+)');
    return new RegExp(`^${regexPath}$`);
  }

  /**
   * Método para recargar rutas desde un archivo
   * @param {Object} server - Instancia del servidor
   * @param {string} filePath - Ruta al archivo JSON de rutas
   * @returns {Promise<Array>} - Array de rutas recargadas
   */
  async reloadRoutes(server, filePath) {
    // Limpiar rutas previamente cargadas
    this.loadedRoutes = [];
    
    // Cargar rutas nuevamente
    return await this.loadRoutes(server, filePath);
  }

  /**
   * Método para obtener las rutas cargadas
   * @returns {Array} - Array de rutas cargadas
   */
  getLoadedRoutes() {
    return this.loadedRoutes;
  }

  /**
   * Método para observar cambios en el archivo de rutas y recargar automáticamente
   * @param {Object} server - Instancia del servidor
   * @param {string} filePath - Ruta al archivo JSON de rutas
   * @param {number} debounceTime - Tiempo de espera entre recargas (milisegundos)
   */
  watchRoutes(server, filePath, debounceTime = 1000) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo de rutas no encontrado: ${filePath}`);
    }

    let timeoutId;
    
    fs.watch(filePath, (eventType) => {
      if (eventType === 'change') {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          try {
            console.log(`Recargando rutas desde: ${filePath}`);
            await this.reloadRoutes(server, filePath);
            console.log('Rutas recargadas exitosamente');
          } catch (error) {
            console.error('Error recargando rutas:', error.message);
          }
        }, debounceTime);
      }
    });
  }
}

module.exports = RouteLoader;