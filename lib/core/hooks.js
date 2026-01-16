/**
 * Sistema de Hooks y Filters como el core de WordPress
 * Implementación para el Framework JERK
 */

class HookSystem {
  constructor() {
    // Almacenar acciones registradas
    this.actions = new Map();
    // Almacenar filtros registrados
    this.filters = new Map();
  }

  /**
   * Registra una acción
   * @param {string} hookName - Nombre del hook
   * @param {Function} callback - Función a ejecutar
   * @param {number} priority - Prioridad (más bajo se ejecuta primero)
   * @param {number} acceptedArgs - Número de argumentos aceptados
   */
  addAction(hookName, callback, priority = 10, acceptedArgs = 1) {
    if (!this.actions.has(hookName)) {
      this.actions.set(hookName, []);
    }

    const hookList = this.actions.get(hookName);
    hookList.push({
      callback,
      priority,
      acceptedArgs,
      id: Date.now() + Math.random() // ID único para identificar el hook
    });

    // Ordenar por prioridad
    hookList.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Registra un filtro
   * @param {string} hookName - Nombre del hook
   * @param {Function} callback - Función a ejecutar
   * @param {number} priority - Prioridad (más bajo se ejecuta primero)
   * @param {number} acceptedArgs - Número de argumentos aceptados
   */
  addFilter(hookName, callback, priority = 10, acceptedArgs = 1) {
    if (!this.filters.has(hookName)) {
      this.filters.set(hookName, []);
    }

    const hookList = this.filters.get(hookName);
    hookList.push({
      callback,
      priority,
      acceptedArgs,
      id: Date.now() + Math.random() // ID único para identificar el hook
    });

    // Ordenar por prioridad
    hookList.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Ejecuta una acción
   * @param {string} hookName - Nombre del hook
   * @param {...any} args - Argumentos a pasar a los callbacks
   */
  doAction(hookName, ...args) {
    const hooks = this.actions.get(hookName);
    if (!hooks || hooks.length === 0) {
      return;
    }

    for (const hook of hooks) {
      // Limitar argumentos según acceptedArgs
      const callArgs = args.slice(0, hook.acceptedArgs);
      hook.callback(...callArgs);
    }
  }

  /**
   * Aplica un filtro
   * @param {string} hookName - Nombre del hook
   * @param {any} value - Valor a filtrar
   * @param {...any} additionalArgs - Argumentos adicionales
   * @returns {any} - Valor filtrado
   */
  applyFilters(hookName, value, ...additionalArgs) {
    const hooks = this.filters.get(hookName);
    if (!hooks || hooks.length === 0) {
      return value;
    }

    let filteredValue = value;
    for (const hook of hooks) {
      // El primer argumento es el valor a filtrar, luego los adicionales
      const callArgs = [filteredValue, ...additionalArgs.slice(0, hook.acceptedArgs - 1)];
      filteredValue = hook.callback(...callArgs);
    }

    return filteredValue;
  }

  /**
   * Verifica si una acción tiene callbacks registrados
   * @param {string} hookName - Nombre del hook
   * @returns {boolean} - True si tiene callbacks registrados
   */
  hasAction(hookName) {
    const hooks = this.actions.get(hookName);
    return !!hooks && hooks.length > 0;
  }

  /**
   * Verifica si un filtro tiene callbacks registrados
   * @param {string} hookName - Nombre del hook
   * @returns {boolean} - True si tiene callbacks registrados
   */
  hasFilter(hookName) {
    const hooks = this.filters.get(hookName);
    return !!hooks && hooks.length > 0;
  }

  /**
   * Elimina una acción específica
   * @param {string} hookName - Nombre del hook
   * @param {Function} callback - Callback a eliminar
   * @param {number} priority - Prioridad del callback
   * @returns {boolean} - True si se eliminó correctamente
   */
  removeAction(hookName, callback, priority = 10) {
    const hooks = this.actions.get(hookName);
    if (!hooks) {
      return false;
    }

    const initialLength = hooks.length;
    const filteredHooks = hooks.filter(hook => 
      !(hook.callback === callback && hook.priority === priority)
    );

    if (filteredHooks.length !== initialLength) {
      this.actions.set(hookName, filteredHooks);
      return true;
    }

    return false;
  }

  /**
   * Elimina un filtro específico
   * @param {string} hookName - Nombre del hook
   * @param {Function} callback - Callback a eliminar
   * @param {number} priority - Prioridad del callback
   * @returns {boolean} - True si se eliminó correctamente
   */
  removeFilter(hookName, callback, priority = 10) {
    const hooks = this.filters.get(hookName);
    if (!hooks) {
      return false;
    }

    const initialLength = hooks.length;
    const filteredHooks = hooks.filter(hook => 
      !(hook.callback === callback && hook.priority === priority)
    );

    if (filteredHooks.length !== initialLength) {
      this.filters.set(hookName, filteredHooks);
      return true;
    }

    return false;
  }

  /**
   * Elimina todas las acciones de un hook
   * @param {string} hookName - Nombre del hook
   * @returns {boolean} - True si se eliminaron correctamente
   */
  removeAllActions(hookName) {
    if (!hookName) {
      this.actions.clear();
      return true;
    }
    
    return this.actions.delete(hookName);
  }

  /**
   * Elimina todos los filtros de un hook
   * @param {string} hookName - Nombre del hook
   * @returns {boolean} - True si se eliminaron correctamente
   */
  removeAllFilters(hookName) {
    if (!hookName) {
      this.filters.clear();
      return true;
    }
    
    return this.filters.delete(hookName);
  }

  /**
   * Obtiene el número de callbacks registrados para una acción
   * @param {string} hookName - Nombre del hook
   * @returns {number} - Número de callbacks
   */
  actionsCount(hookName) {
    const hooks = this.actions.get(hookName);
    return hooks ? hooks.length : 0;
  }

  /**
   * Obtiene el número de callbacks registrados para un filtro
   * @param {string} hookName - Nombre del hook
   * @returns {number} - Número de callbacks
   */
  filtersCount(hookName) {
    const hooks = this.filters.get(hookName);
    return hooks ? hooks.length : 0;
  }
}

module.exports = HookSystem;