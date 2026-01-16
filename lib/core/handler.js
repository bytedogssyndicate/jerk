/**
 * Gestión de handlers para el framework JERK
 * Implementación del componente core/handler.js
 */

class HandlerManager {
  /**
   * Constructor del gestor de handlers
   */
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Método para registrar un handler
   * @param {string} name - Nombre del handler
   * @param {Function} handler - Función handler
   */
  register(name, handler) {
    this.handlers.set(name, handler);
  }

  /**
   * Método para obtener un handler registrado
   * @param {string} name - Nombre del handler
   * @returns {Function|null} - Función handler o null si no existe
   */
  get(name) {
    return this.handlers.get(name) || null;
  }

  /**
   * Método para ejecutar un handler
   * @param {string} name - Nombre del handler
   * @param {Object} req - Objeto de solicitud HTTP
   * @param {Object} res - Objeto de respuesta HTTP
   * @returns {*} - Resultado de la ejecución del handler
   */
  async execute(name, req, res) {
    const handler = this.get(name);
    if (!handler) {
      throw new Error(`Handler '${name}' no encontrado`);
    }
    
    // Verificar si el handler es una función asíncrona o no
    if (handler.constructor.name === 'AsyncFunction') {
      return await handler(req, res);
    } else {
      return handler(req, res);
    }
  }

  /**
   * Método para eliminar un handler
   * @param {string} name - Nombre del handler
   */
  remove(name) {
    this.handlers.delete(name);
  }

  /**
   * Método para limpiar todos los handlers
   */
  clear() {
    this.handlers.clear();
  }

  /**
   * Método para verificar si un handler existe
   * @param {string} name - Nombre del handler
   * @returns {boolean} - True si existe, false en caso contrario
   */
  has(name) {
    return this.handlers.has(name);
  }

  /**
   * Método para obtener todos los nombres de handlers
   * @returns {Array} - Array con los nombres de todos los handlers
   */
  getAllNames() {
    return Array.from(this.handlers.keys());
  }
}

module.exports = HandlerManager;