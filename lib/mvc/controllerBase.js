/**
 * Controlador base para el framework JERK
 * Implementación del componente MVC controllerBase.js
 * Similar al sistema de controladores de CodeIgniter
 */

const ViewEngine = require('./viewEngine');

class ControllerBase {
  constructor(options = {}) {
    // Inicializar el motor de vistas
    this.viewEngine = new ViewEngine({
      viewsPath: options.viewsPath || './views',
      defaultExtension: options.defaultExtension || '.html',
      cacheEnabled: options.cacheEnabled
    });
    
    // Inicializar variables de datos para la vista
    this.viewData = {};
    
    // Referencia al objeto de solicitud y respuesta (cuando esté disponible)
    this.req = null;
    this.res = null;
  }

  /**
   * Establece variables para pasar a la vista
   * @param {string|Object} key - Nombre de la variable o objeto con múltiples variables
   * @param {*} value - Valor de la variable (si key es string)
   */
  set(key, value) {
    if (typeof key === 'object') {
      // Si se pasa un objeto, fusionar con viewData
      this.viewData = { ...this.viewData, ...key };
    } else {
      // Si se pasa una clave y valor, asignar individualmente
      this.viewData[key] = value;
    }
  }

  /**
   * Renderiza una vista con las variables actuales
   * @param {string} viewName - Nombre de la vista a renderizar
   * @param {Object} additionalData - Datos adicionales para pasar a la vista
   * @param {Object} options - Opciones adicionales
   */
  view(viewName, additionalData = {}, options = {}) {
    // Fusionar datos de la vista con datos adicionales
    const data = { ...this.viewData, ...additionalData };
    
    // Renderizar la vista
    const renderedView = this.viewEngine.render(viewName, data, options);
    
    return renderedView;
  }

  /**
   * Renderiza una vista y la envía como respuesta HTTP
   * @param {Object} res - Objeto de respuesta HTTP
   * @param {string} viewName - Nombre de la vista a renderizar
   * @param {Object} additionalData - Datos adicionales para pasar a la vista
   * @param {Object} options - Opciones adicionales
   */
  render(res, viewName, additionalData = {}, options = {}) {
    try {
      // Renderizar la vista
      const renderedView = this.view(viewName, additionalData, options);
      
      // Enviar la vista renderizada como respuesta
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderedView);
    } catch (error) {
      console.error('Error renderizando vista:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Error interno del servidor');
    }
  }

  /**
   * Renderiza una vista parcial (sin layout)
   * @param {string} viewName - Nombre de la vista parcial
   * @param {Object} additionalData - Datos adicionales para pasar a la vista
   * @returns {string} - Vista parcial renderizada
   */
  partial(viewName, additionalData = {}) {
    // Fusionar datos de la vista con datos adicionales
    const data = { ...this.viewData, ...additionalData };
    
    // Renderizar la vista parcial
    return this.viewEngine.render(viewName, data);
  }

  /**
   * Redirecciona a otra URL
   * @param {Object} res - Objeto de respuesta HTTP
   * @param {string} url - URL a la que redireccionar
   */
  redirect(res, url) {
    res.writeHead(302, { 'Location': url });
    res.end();
  }

  /**
   * Devuelve una respuesta JSON
   * @param {Object} res - Objeto de respuesta HTTP
   * @param {Object} data - Datos a enviar como JSON
   * @param {number} statusCode - Código de estado HTTP
   */
  json(res, data, statusCode = 200) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
  }

  /**
   * Obtiene un valor de la solicitud (query, body o params)
   * @param {string} key - Clave del valor a obtener
   * @param {*} defaultValue - Valor por defecto si no se encuentra
   * @returns {*} - Valor obtenido o valor por defecto
   */
  input(key, defaultValue = null) {
    if (!this.req) {
      return defaultValue;
    }

    // Buscar en body, query y params
    if (this.req.body && typeof this.req.body === 'object' && key in this.req.body) {
      return this.req.body[key];
    }

    if (this.req.query && typeof this.req.query === 'object' && key in this.req.query) {
      return this.req.query[key];
    }

    if (this.req.params && typeof this.req.params === 'object' && key in this.req.params) {
      return this.req.params[key];
    }

    return defaultValue;
  }

  /**
   * Obtiene todos los valores de entrada
   * @returns {Object} - Todos los valores de entrada combinados
   */
  allInput() {
    if (!this.req) {
      return {};
    }

    return {
      ...this.getBody(),
      ...this.getQuery(),
      ...this.getParams()
    };
  }

  /**
   * Obtiene los parámetros de consulta (query)
   * @returns {Object} - Parámetros de consulta
   */
  getQuery() {
    return this.req?.query || {};
  }

  /**
   * Obtiene el cuerpo de la solicitud (body)
   * @returns {Object} - Cuerpo de la solicitud
   */
  getBody() {
    return this.req?.body || {};
  }

  /**
   * Obtiene los parámetros de ruta (params)
   * @returns {Object} - Parámetros de ruta
   */
  getParams() {
    return this.req?.params || {};
  }

  /**
   * Establece la solicitud y respuesta actuales
   * @param {Object} req - Objeto de solicitud HTTP
   * @param {Object} res - Objeto de respuesta HTTP
   */
  setRequestResponse(req, res) {
    this.req = req;
    this.res = res;
  }

  /**
   * Obtiene la instancia del motor de vistas
   * @returns {ViewEngine} - Instancia del motor de vistas
   */
  getViewEngine() {
    return this.viewEngine;
  }

  /**
   * Limpia las variables de vista
   */
  clearViewData() {
    this.viewData = {};
  }
}

module.exports = ControllerBase;