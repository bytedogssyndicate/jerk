/**
 * Carga de controladores para el framework API SDK
 * Implementación del componente loader/controllerLoader.js
 */

const fs = require('fs');
const path = require('path');

class ControllerLoader {
  /**
   * Constructor del cargador de controladores
   */
  constructor() {
    this.loadedControllers = new Map();
  }

  /**
   * Método para cargar un controlador desde un archivo
   * @param {string} controllerPath - Ruta al archivo del controlador
   * @returns {Object} - Módulo del controlador cargado
   */
  loadController(controllerPath) {
    try {
      // Disparar hook antes de cargar el controlador
      const hooks = require('../../index.js').hooks;
      if (hooks) {
        hooks.doAction('pre_controller_load', controllerPath);
      }

      // Resolver la ruta absoluta
      const absolutePath = path.resolve(process.cwd(), controllerPath);

      // Verificar si el archivo existe
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Archivo del controlador no encontrado: ${absolutePath}`);
      }

      // Cargar el módulo del controlador
      const controllerModule = require(absolutePath);

      // Guardar en cache
      this.loadedControllers.set(absolutePath, controllerModule);

      // Disparar hook después de cargar el controlador
      if (hooks) {
        hooks.doAction('post_controller_load', controllerModule, absolutePath);
      }

      return controllerModule;
    } catch (error) {
      throw new Error(`Error cargando controlador ${controllerPath}: ${error.message}`);
    }
  }

  /**
   * Método para cargar múltiples controladores desde un directorio
   * @param {string} directoryPath - Ruta al directorio de controladores
   * @param {Object} options - Opciones de carga
   * @returns {Object} - Objeto con todos los controladores cargados
   */
  loadControllersFromDirectory(directoryPath, options = {}) {
    try {
      // Resolver la ruta absoluta
      const absoluteDirPath = path.resolve(process.cwd(), directoryPath);
      
      // Verificar si el directorio existe
      if (!fs.existsSync(absoluteDirPath)) {
        throw new Error(`Directorio de controladores no encontrado: ${absoluteDirPath}`);
      }

      // Obtener archivos del directorio
      const files = fs.readdirSync(absoluteDirPath);
      
      const controllers = {};
      
      for (const file of files) {
        // Solo procesar archivos JavaScript
        if (file.endsWith('.js')) {
          const controllerName = path.basename(file, '.js');
          const controllerPath = path.join(absoluteDirPath, file);
          
          try {
            const controllerModule = this.loadController(controllerPath);
            controllers[controllerName] = controllerModule;
          } catch (error) {
            if (options.ignoreErrors) {
              console.warn(`Advertencia: No se pudo cargar el controlador ${controllerPath}: ${error.message}`);
            } else {
              throw error;
            }
          }
        }
      }
      
      return controllers;
    } catch (error) {
      throw new Error(`Error cargando controladores desde el directorio ${directoryPath}: ${error.message}`);
    }
  }

  /**
   * Método para obtener un controlador del cache
   * @param {string} controllerPath - Ruta al archivo del controlador
   * @returns {Object|null} - Módulo del controlador o null si no está cargado
   */
  getCachedController(controllerPath) {
    const absolutePath = path.resolve(process.cwd(), controllerPath);
    return this.loadedControllers.get(absolutePath) || null;
  }

  /**
   * Método para limpiar el cache de controladores
   */
  clearCache() {
    // Eliminar módulos del cache de require para forzar recarga
    for (const [path, module] of this.loadedControllers) {
      delete require.cache[require.resolve(path)];
    }
    
    this.loadedControllers.clear();
  }

  /**
   * Método para recargar un controlador
   * @param {string} controllerPath - Ruta al archivo del controlador
   * @returns {Object} - Módulo del controlador recargado
   */
  reloadController(controllerPath) {
    // Eliminar del cache de require para forzar recarga
    const absolutePath = path.resolve(process.cwd(), controllerPath);
    if (require.cache[require.resolve(absolutePath)]) {
      delete require.cache[require.resolve(absolutePath)];
    }
    
    // Volver a cargar
    return this.loadController(controllerPath);
  }

  /**
   * Método para obtener la lista de controladores cargados
   * @returns {Array} - Array con las rutas de los controladores cargados
   */
  getLoadedControllersList() {
    return Array.from(this.loadedControllers.keys());
  }

  /**
   * Método para verificar si un controlador está cargado
   * @param {string} controllerPath - Ruta al archivo del controlador
   * @returns {boolean} - True si está cargado, false en caso contrario
   */
  isControllerLoaded(controllerPath) {
    const absolutePath = path.resolve(process.cwd(), controllerPath);
    return this.loadedControllers.has(absolutePath);
  }

  /**
   * Método para cargar un controlador y obtener un handler específico
   * @param {string} controllerPath - Ruta al archivo del controlador
   * @param {string} handlerName - Nombre del handler a obtener
   * @returns {Function|null} - Función handler o null si no existe
   */
  getHandlerFromController(controllerPath, handlerName) {
    const controller = this.loadController(controllerPath);
    const handler = controller[handlerName];
    
    if (typeof handler !== 'function') {
      throw new Error(`El handler '${handlerName}' no es una función en el controlador: ${controllerPath}`);
    }
    
    return handler;
  }
}

module.exports = ControllerLoader;