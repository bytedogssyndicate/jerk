/**
 * Sistema de enrutamiento avanzado para el framework API SDK
 * Implementación extendida del componente core/router.js
 * Incluye soporte para rutas anidadas y otras mejoras
 */

class Router {
  /**
   * Constructor del router
   * @param {Object} options - Opciones de configuración
   * @param {string} options.prefix - Prefijo común para todas las rutas del router
   */
  constructor(options = {}) {
    this.routes = [];
    this.nestedRouters = [];
    this.prefix = options.prefix || '';
  }

  /**
   * Método para agregar una ruta GET
   * @param {string} path - Ruta del endpoint
   * @param {Function} handler - Función manejadora de la ruta
   */
  get(path, handler) {
    this.addRoute('GET', path, handler);
    return this;
  }

  /**
   * Método para agregar una ruta POST
   * @param {string} path - Ruta del endpoint
   * @param {Function} handler - Función manejadora de la ruta
   */
  post(path, handler) {
    this.addRoute('POST', path, handler);
    return this;
  }

  /**
   * Método para agregar una ruta PUT
   * @param {string} path - Ruta del endpoint
   * @param {Function} handler - Función manejadora de la ruta
   */
  put(path, handler) {
    this.addRoute('PUT', path, handler);
    return this;
  }

  /**
   * Método para agregar una ruta DELETE
   * @param {string} path - Ruta del endpoint
   * @param {Function} handler - Función manejadora de la ruta
   */
  delete(path, handler) {
    this.addRoute('DELETE', path, handler);
    return this;
  }

  /**
   * Método para agregar una ruta PATCH
   * @param {string} path - Ruta del endpoint
   * @param {Function} handler - Función manejadora de la ruta
   */
  patch(path, handler) {
    this.addRoute('PATCH', path, handler);
    return this;
  }

  /**
   * Método para agregar una ruta genérica
   * @param {string} method - Método HTTP
   * @param {string} path - Ruta del endpoint
   * @param {Function} handler - Función manejadora de la ruta
   */
  addRoute(method, path, handler) {
    // Si hay un prefijo, combinarlo con la ruta
    const fullPath = this.prefix ? `${this.prefix}${path}` : path;
    
    this.routes.push({
      method: method.toUpperCase(),
      path: fullPath,
      handler
    });
  }

  /**
   * Método para agregar un router anidado
   * @param {string} prefix - Prefijo para las rutas anidadas
   * @param {Router} router - Router a anidar
   */
  addNestedRouter(prefix, router) {
    // Agregar prefijo al router anidado
    const nestedRouterWithPrefix = {
      prefix,
      router
    };
    
    this.nestedRouters.push(nestedRouterWithPrefix);
    
    // También agregar las rutas directamente para facilitar la búsqueda
    const nestedRoutes = router.getRoutes();
    for (const route of nestedRoutes) {
      const prefixedPath = `${prefix}${route.path}`;
      this.routes.push({
        method: route.method,
        path: prefixedPath,
        handler: route.handler
      });
    }
  }

  /**
   * Método para obtener todas las rutas
   * @returns {Array} - Array con todas las rutas registradas
   */
  getRoutes() {
    return this.routes;
  }

  /**
   * Método para combinar rutas de otro router
   * @param {Router} router - Otro objeto Router
   */
  merge(router) {
    if (router instanceof Router) {
      this.routes = this.routes.concat(router.getRoutes());
      
      // Copiar también los routers anidados
      if (router.nestedRouters) {
        this.nestedRouters = this.nestedRouters.concat(router.nestedRouters);
      }
    }
  }

  /**
   * Método para aplicar prefijo a todas las rutas
   * @param {string} prefix - Prefijo a aplicar
   */
  setPrefix(prefix) {
    this.prefix = prefix;
    
    // Actualizar todas las rutas existentes con el nuevo prefijo
    for (let i = 0; i < this.routes.length; i++) {
      // Remover el prefijo anterior si existe
      if (this.routes[i].originalPath) {
        this.routes[i].path = `${prefix}${this.routes[i].originalPath}`;
      } else {
        // Guardar la ruta original antes de aplicar el prefijo
        const originalPathWithoutCurrentPrefix = this.routes[i].path.replace(/^\/?[^\/]+\/?/, '');
        this.routes[i].originalPath = originalPathWithoutCurrentPrefix;
        this.routes[i].path = `${prefix}${originalPathWithoutCurrentPrefix}`;
      }
    }
  }

  /**
   * Método para definir middleware específico para ciertas rutas
   * @param {string|Array} path - Ruta(s) a las que aplicar el middleware
   * @param {Function} middleware - Función de middleware
   */
  use(path, middleware) {
    // Si el segundo parámetro es una función, es un middleware para todas las rutas
    if (typeof path === 'function') {
      middleware = path;
      path = '/*'; // Aplicar a todas las rutas
    }

    // Crear un handler especial que ejecuta el middleware y luego el handler original
    const middlewareHandler = (req, res, next) => {
      return new Promise((resolve, reject) => {
        const wrappedNext = (err) => {
          if (err) {
            reject(err);
          } else {
            if (next) next();
            resolve();
          }
        };
        
        // Ejecutar middleware
        const result = middleware(req, res, wrappedNext);
        
        // Si el middleware devuelve una promesa, esperarla
        if (result && typeof result.then === 'function') {
          result.then(() => {
            if (next) next();
            resolve();
          }).catch(reject);
        }
      });
    };

    // Si path es un array, aplicar a todas las rutas del array
    if (Array.isArray(path)) {
      for (const singlePath of path) {
        this.addRoute('USE', singlePath, middlewareHandler);
      }
    } else {
      this.addRoute('USE', path, middlewareHandler);
    }
  }
}

module.exports = Router;