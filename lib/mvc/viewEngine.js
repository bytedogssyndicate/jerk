/**
 * Motor de vistas profesional para el framework JERK
 * Implementación del componente MVC viewEngine.js
 * Sistema robusto con soporte para hooks, filters y actions
 */

const fs = require('fs');
const path = require('path');

class ViewEngine {
  constructor(options = {}) {
    this.viewsPath = options.viewsPath || './views';
    this.defaultExtension = options.defaultExtension || '.html';
    this.cacheEnabled = options.cacheEnabled !== false; // Por defecto habilitado
    this.viewCache = new Map(); // Cache de vistas compiladas
    this.logger = options.logger || console;
    
    // Sistema de hooks para extensibilidad
    this.hooks = options.hooks || null;
    
    // Sistema de filtros
    this.filters = new Map();
    this.helpers = new Map(); // Sistema de helpers personalizados
    this.registerDefaultFilters();
    this.registerDefaultHelpers();
    
    // Asegurar que el directorio de vistas existe
    if (!fs.existsSync(this.viewsPath)) {
      fs.mkdirSync(this.viewsPath, { recursive: true });
    }
  }

  /**
   * Registra filtros por defecto
   */
  registerDefaultFilters() {
    // Filtro para escapar HTML
    this.filters.set('escape', (value) => {
      if (typeof value !== 'string') return value;
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    });
    
    // Filtro para convertir a mayúsculas
    this.filters.set('upper', (value) => {
      if (typeof value !== 'string') return value;
      return value.toUpperCase();
    });
    
    // Filtro para convertir a minúsculas
    this.filters.set('lower', (value) => {
      if (typeof value !== 'string') return value;
      return value.toLowerCase();
    });
    
    // Filtro para capitalizar
    this.filters.set('capitalize', (value) => {
      if (typeof value !== 'string') return value;
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    });
    
    // Filtro para formatear fecha
    this.filters.set('date', (value, format = 'YYYY-MM-DD HH:mm:ss') => {
      if (!value) return value;
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      
      const pad = (n) => n.toString().padStart(2, '0');
      const padYear = (n) => n.toString().padStart(4, '0');
      
      return format
        .replace('YYYY', padYear(date.getFullYear()))
        .replace('MM', pad(date.getMonth() + 1))
        .replace('DD', pad(date.getDate()))
        .replace('HH', pad(date.getHours()))
        .replace('mm', pad(date.getMinutes()))
        .replace('ss', pad(date.getSeconds()));
    });
    
    // Filtro para truncar texto
    this.filters.set('truncate', (value, length = 100, suffix = '...') => {
      if (typeof value !== 'string') return value;
      return value.length > length ? value.substring(0, length) + suffix : value;
    });
  }

  /**
   * Registra helpers por defecto
   */
  registerDefaultHelpers() {
    // Helper para formatear fecha
    this.helpers.set('formatDate', (date, format = 'YYYY-MM-DD HH:mm:ss') => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      
      const pad = (n) => n.toString().padStart(2, '0');
      const padYear = (n) => n.toString().padStart(4, '0');
      
      return format
        .replace('YYYY', padYear(d.getFullYear()))
        .replace('MM', pad(d.getMonth() + 1))
        .replace('DD', pad(d.getDate()))
        .replace('HH', pad(d.getHours()))
        .replace('mm', pad(d.getMinutes()))
        .replace('ss', pad(d.getSeconds()));
    });
    
    // Helper para verificar si un valor es par
    this.helpers.set('isEven', (value) => {
      return Number(value) % 2 === 0;
    });
    
    // Helper para contar elementos
    this.helpers.set('count', (array) => {
      return Array.isArray(array) ? array.length : 0;
    });
  }

  /**
   * Registra un filtro personalizado
   * @param {string} name - Nombre del filtro
   * @param {Function} filterFn - Función del filtro
   */
  addFilter(name, filterFn) {
    this.filters.set(name, filterFn);
  }

  /**
   * Registra un helper personalizado
   * @param {string} name - Nombre del helper
   * @param {Function} helperFn - Función del helper
   */
  addHelper(name, helperFn) {
    this.helpers.set(name, helperFn);
  }

  /**
   * Aplica un filtro a un valor
   * @param {*} value - Valor a filtrar
   * @param {string} filterName - Nombre del filtro
   * @param {...*} args - Argumentos adicionales para el filtro
   * @returns {*} - Valor filtrado
   */
  applyFilter(value, filterName, ...args) {
    const filter = this.filters.get(filterName);
    if (filter) {
      return filter(value, ...args);
    }
    return value;
  }

  /**
   * Ejecuta un helper
   * @param {string} helperName - Nombre del helper
   * @param {...*} args - Argumentos para el helper
   * @returns {*} - Resultado del helper
   */
  executeHelper(helperName, ...args) {
    const helper = this.helpers.get(helperName);
    if (helper) {
      return helper(...args);
    }
    return '';
  }

  /**
   * Valida la sintaxis de un template
   * @param {string} template - Template a validar
   * @returns {Array} - Array de errores encontrados
   */
  static validateTemplate(template) {
    const errors = [];
    
    // Validar apertura y cierre de bloques condicionales
    const ifMatches = template.match(/\{\{if\s+.*?\}\}/g) || [];
    const endifMatches = template.match(/\{\{endif\}\}/g) || [];
    
    if (ifMatches.length !== endifMatches.length) {
      errors.push(`Desbalance de bloques {{if}}/{{endif}}: ${ifMatches.length} aperturas, ${endifMatches.length} cierres`);
    }
    
    // Validar apertura y cierre de bloques foreach
    const foreachMatches = template.match(/\{\{foreach:.*?\}\}/g) || [];
    const endforeachMatches = template.match(/\{\{endforeach\}\}/g) || [];
    
    if (foreachMatches.length !== endforeachMatches.length) {
      errors.push(`Desbalance de bloques {{foreach}}/{{endforeach}}: ${foreachMatches.length} aperturas, ${endforeachMatches.length} cierres`);
    }
    
    // Validar apertura y cierre de bloques include
    const includeMatches = template.match(/\{\{include:.*?\}\}/g) || [];
    
    // Validar sintaxis básica de variables
    const malformedVars = template.match(/\{\{[^}]*$/g);
    if (malformedVars && malformedVars.length > 0) {
      errors.push(`Variables mal formadas: ${malformedVars.join(', ')}`);
    }
    
    return errors;
  }

  /**
   * Renderiza una vista con variables
   * @param {string} viewName - Nombre de la vista a renderizar
   * @param {Object} data - Variables a pasar a la vista
   * @param {Object} options - Opciones adicionales
   * @returns {string} - Contenido renderizado de la vista
   */
  render(viewName, data = {}, options = {}) {
    // Obtener la ruta completa de la vista
    const viewPath = this.getViewPath(viewName);
    
    // Verificar si la vista existe
    if (!fs.existsSync(viewPath)) {
      throw new Error(`Vista no encontrada: ${viewPath}`);
    }

    // Intentar obtener del cache si está habilitado
    if (this.cacheEnabled && this.viewCache.has(viewPath)) {
      const cachedView = this.viewCache.get(viewPath);
      return this.processTemplate(cachedView, data, options);
    }

    // Leer el contenido de la vista
    let viewContent = fs.readFileSync(viewPath, 'utf8');

    // Validar sintaxis del template si está habilitado
    if (options.validateSyntax !== false) {
      const validationErrors = ViewEngine.validateTemplate(viewContent);
      if (validationErrors.length > 0) {
        this.logger.warn(`Errores de sintaxis en la vista ${viewName}:`, validationErrors);
      }
    }

    // Procesar bloques de inclusión (similar a <?php include ?>)
    viewContent = this.processIncludes(viewContent, path.dirname(viewPath));

    // Si el cache está habilitado, guardar la vista compilada (sin variables)
    if (this.cacheEnabled) {
      this.viewCache.set(viewPath, viewContent);
    }

    // Procesar el template con las variables
    return this.processTemplate(viewContent, data, options);
  }

  /**
   * Obtiene la ruta completa de una vista
   * @param {string} viewName - Nombre de la vista
   * @returns {string} - Ruta completa a la vista
   */
  getViewPath(viewName) {
    // Convertir puntos a barras para permitir vistas anidadas
    const normalizedPath = viewName.replace(/\./g, '/');
    
    // Construir la ruta
    let viewPath = path.join(this.viewsPath, normalizedPath);
    
    // Añadir extensión por defecto si no está presente
    if (!path.extname(viewPath)) {
      viewPath += this.defaultExtension;
    }
    
    return viewPath;
  }

  /**
   * Procesa bloques de inclusión en la vista
   * @param {string} content - Contenido de la vista
   * @param {string} currentDir - Directorio actual para resolver inclusiones relativas
   * @returns {string} - Contenido con inclusiones procesadas
   */
  processIncludes(content, currentDir) {
    // Patrón para encontrar bloques de inclusión como {{include:nombre_vista}}
    const includePattern = /\{\{include:(.*?)\}\}/g;
    
    return content.replace(includePattern, (match, includePath) => {
      try {
        // Resolver la ruta de inclusión
        let includeFullPath;
        
        // Si la ruta empieza con ./ o ../, es relativa al directorio actual
        if (includePath.startsWith('./') || includePath.startsWith('../')) {
          includeFullPath = path.resolve(currentDir, includePath);
          
          // Si no tiene extensión, añadir la por defecto
          if (!path.extname(includeFullPath)) {
            includeFullPath += this.defaultExtension;
          }
        } else {
          // Sino, usar la ruta de vistas por defecto
          includeFullPath = this.getViewPath(includePath);
        }
        
        // Verificar si el archivo de inclusión existe
        if (!fs.existsSync(includeFullPath)) {
          this.logger.warn(`Archivo de inclusión no encontrado: ${includeFullPath}`);
          return `<!-- Archivo de inclusión no encontrado: ${includePath} -->`;
        }
        
        // Leer y procesar el contenido del archivo incluido
        let includedContent = fs.readFileSync(includeFullPath, 'utf8');
        includedContent = this.processIncludes(includedContent, path.dirname(includeFullPath)); // Recursión para inclusiones anidadas
        
        return includedContent;
      } catch (error) {
        this.logger.error(`Error procesando inclusión: ${includePath}`, error);
        return `<!-- Error procesando inclusión: ${includePath} -->`;
      }
    });
  }

  /**
   * Procesa un template con variables
   * @param {string} template - Template a procesar
   * @param {Object} data - Variables a sustituir
   * @param {Object} options - Opciones adicionales
   * @returns {string} - Template procesado
   */
  processTemplate(template, data, options = {}) {
    let processedTemplate = template;
    
    // Aplicar hooks antes de procesar el template
    if (this.hooks) {
      processedTemplate = this.hooks.applyFilters('template_pre_process', processedTemplate, data);
    }
    
    // Procesar el template con múltiples pasadas para manejar anidaciones
    let previousTemplate;
    let iterations = 0;
    const maxIterations = 10; // Prevenir bucles infinitos
    
    do {
      previousTemplate = processedTemplate;
      
      // Procesar bucles foreach: {{foreach:array}}contenido{{endforeach}}
      processedTemplate = this.processForeach(processedTemplate, data, options);
      
      // Procesar estructuras condicionales: {{if variable}}contenido{{endif}}
      processedTemplate = this.processConditionals(processedTemplate, data, options);
      
      // Reemplazar variables simples y anidadas: {{variable}} y {{objeto.propiedad}} -> valor
      processedTemplate = this.replaceVariablesAndFilters(processedTemplate, data, options);
      
      iterations++;
    } while (previousTemplate !== processedTemplate && iterations < maxIterations);

    // Aplicar hooks después de procesar el template
    if (this.hooks) {
      processedTemplate = this.hooks.applyFilters('template_post_process', processedTemplate, data);
    }
    
    return processedTemplate;
  }

  /**
   * Reemplaza variables y aplica filtros
   * @param {string} template - Template a procesar
   * @param {Object} data - Variables a sustituir
   * @param {Object} options - Opciones adicionales
   * @returns {string} - Template con variables reemplazadas
   */
  replaceVariablesAndFilters(template, data, options = {}) {
    let processedTemplate = template;
    
    // Patrón para encontrar variables con filtros: {{variable|filtro1|filtro2:arg1,arg2}}
    const variablePattern = /\{\{\s*([^{}]+?)\s*\}\}/g;

    processedTemplate = processedTemplate.replace(variablePattern, (match, variableWithFilters) => {
      // Separar la variable de los filtros
      const parts = variableWithFilters.split('|');
      const variableName = parts[0].trim();

      // Verificar si es un helper (función)
      if (variableName.includes('(') && variableName.includes(')')) {
        // Es un helper, procesarlo
        const helperMatch = variableName.match(/^([a-zA-Z0-9_]+)\((.*)\)$/);
        if (helperMatch) {
          const helperName = helperMatch[1];
          const argsString = helperMatch[2];

          // Parsear argumentos
          let args = [];
          if (argsString.trim()) {
            args = this.parseArguments(argsString);
            // Si los argumentos son variables, obtener sus valores
            args = args.map(arg => {
              // Si no es una cadena entre comillas, intentar obtener el valor como variable
              if (!(arg.startsWith('"') && arg.endsWith('"')) &&
                  !(arg.startsWith("'") && arg.endsWith("'"))) {
                const varValue = this.getVariableValue(arg, data);
                return varValue !== undefined ? varValue : arg;
              }
              return arg;
            });
          }

          return String(this.executeHelper(helperName, ...args));
        }
      }
      
      // Obtener el valor de la variable
      let value = this.getVariableValue(variableName, data);
      
      // Si la variable no existe y estamos en modo desarrollo, registrar advertencia
      if (value === undefined && options.showWarnings !== false) {
        this.logger.warn(`Variable no definida en template: ${variableName}`);
      }
      
      // Si la variable no existe, devolver la variable original para debugging
      if (value === undefined) {
        return options.preserveUndefined !== false ? match : '';
      }
      
      // Aplicar filtros secuencialmente
      for (let i = 1; i < parts.length; i++) {
        const filterPart = parts[i].trim();
        // Modificar la expresión regular para manejar argumentos entre comillas
        const filterMatch = filterPart.match(/^([a-zA-Z0-9_]+)(?::(.*))?$/);

        if (filterMatch) {
          const filterName = filterMatch[1];
          let filterArgs = [];

          if (filterMatch[2]) {
            // Separar argumentos por coma, pero respetando cadenas entre comillas
            filterArgs = this.parseArguments(filterMatch[2]);
          }

          value = this.applyFilter(value, filterName, ...filterArgs);
        }
      }
      
      return String(value);
    });
    
    return processedTemplate;
  }

  /**
   * Procesa estructuras condicionales en el template
   * @param {string} template - Template a procesar
   * @param {Object} data - Variables disponibles
   * @param {Object} options - Opciones adicionales
   * @returns {string} - Template con condiciones procesadas
   */
  processConditionals(template, data, options = {}) {
    // Patrón para encontrar bloques condicionales: {{if variable}}contenido{{endif}} o {{if variable}}contenido{{else}}contenido{{endif}}
    const conditionalPattern = /\{\{if\s+(.*?)\}\}(.*?)(?:\{\{else\}\}(.*?))?\{\{endif\}\}/gs;
    
    return template.replace(conditionalPattern, (match, condition, ifContent, elseContent) => {
      // Limpiar la condición
      const cleanCondition = condition.trim();
      
      // Evaluar la condición (ahora soporta variables anidadas como objeto.propiedad)
      let conditionResult = false;
      
      // Soportar condiciones simples como: variable, !variable, variable == valor, etc.
      if (cleanCondition.startsWith('!')) {
        const varName = cleanCondition.substring(1).trim();
        conditionResult = !this.getVariableValue(varName, data);
      } else if (cleanCondition.includes('==')) {
        const [left, right] = cleanCondition.split('==').map(s => s.trim());
        const leftVal = this.getVariableValue(left, data);
        const rightVal = this.getVariableValue(right, data);
        conditionResult = leftVal == rightVal;
      } else if (cleanCondition.includes('===')) {
        const [left, right] = cleanCondition.split('===').map(s => s.trim());
        const leftVal = this.getVariableValue(left, data);
        const rightVal = this.getVariableValue(right, data);
        conditionResult = leftVal === rightVal;
      } else if (cleanCondition.includes('!=')) {
        const [left, right] = cleanCondition.split('!=').map(s => s.trim());
        const leftVal = this.getVariableValue(left, data);
        const rightVal = this.getVariableValue(right, data);
        conditionResult = leftVal != rightVal;
      } else if (cleanCondition.includes('!==')) {
        const [left, right] = cleanCondition.split('!==').map(s => s.trim());
        const leftVal = this.getVariableValue(left, data);
        const rightVal = this.getVariableValue(right, data);
        conditionResult = leftVal !== rightVal;
      } else {
        // Condición simple: verdadero si la variable existe y no es falsy
        conditionResult = !!this.getVariableValue(cleanCondition, data);
      }
      
      // Devolver el contenido correspondiente según el resultado de la condición
      return conditionResult ? ifContent : (elseContent || '');
    });
  }

  /**
   * Procesa bucles foreach en el template
   * @param {string} template - Template a procesar
   * @param {Object} data - Variables disponibles
   * @param {Object} options - Opciones adicionales
   * @returns {string} - Template con bucles procesados
   */
  processForeach(template, data, options = {}) {
    // Patrón para encontrar bloques foreach: {{foreach:array}}contenido{{endforeach}}
    const foreachPattern = /\{\{foreach:(.*?)\}\}(.*?)\{\{endforeach\}\}/gs;
    
    return template.replace(foreachPattern, (match, arraySpec, content) => {
      // Analizar la especificación del array: array as key => value o solo array
      const arrayMatch = arraySpec.match(/^(\w+)\s+as\s+(\w+)\s*=>\s*(\w+)$/);
      
      let arrayName, keyVar, valueVar;
      if (arrayMatch) {
        // Formato: array as key => value
        [, arrayName, keyVar, valueVar] = arrayMatch;
      } else {
        // Formato: array (usar índice como clave y valor como elemento)
        arrayName = arraySpec.trim();
        keyVar = 'index';
        valueVar = 'item';
      }
      
      // Obtener el array de datos
      const array = data[arrayName];
      if (!Array.isArray(array) && typeof array !== 'object') {
        this.logger.warn(`La variable '${arrayName}' no es un array u objeto iterable`);
        return '';
      }
      
      let result = '';
      
      // Iterar sobre el array u objeto
      if (Array.isArray(array)) {
        array.forEach((item, index) => {
          // Crear un contexto temporal con las variables del bucle
          const loopContext = { ...data };
          loopContext[keyVar] = index;
          loopContext[valueVar] = item;

          // Procesar el contenido del bucle con el contexto actual
          let loopContent = content;
          
          // Primero procesar las variables del objeto interno (como item.name, item.email)
          if (typeof item === 'object' && item !== null) {
            for (const [propKey, propValue] of Object.entries(item)) {
              const fullKey = `${valueVar}.${propKey}`;
              const escapedKey = fullKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g');
              
              let stringValue;
              if (typeof propValue === 'object' && propValue !== null) {
                stringValue = JSON.stringify(propValue);
              } else {
                stringValue = String(propValue);
              }
              
              loopContent = loopContent.replace(regex, stringValue);
            }
          }

          // Luego procesar las variables generales del contexto
          for (const [key, value] of Object.entries(loopContext)) {
            // Solo procesar variables simples, no las que ya se procesaron como item.prop
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
              const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g');

              let stringValue;
              if (typeof value === 'object' && value !== null) {
                stringValue = JSON.stringify(value);
              } else {
                stringValue = String(value);
              }

              loopContent = loopContent.replace(regex, stringValue);
            }
          }

          // Procesar condiciones y bucles anidados
          // Aplicar recursivamente el procesamiento para manejar condiciones anidadas
          let previousLoopContent;
          let iterations = 0;
          const maxIterations = 5; // Prevenir bucles infinitos
          
          do {
            previousLoopContent = loopContent;
            loopContent = this.processConditionals(loopContent, loopContext, options);
            loopContent = this.processForeach(loopContent, loopContext, options);
            loopContent = this.replaceVariablesAndFilters(loopContent, loopContext, options);
            iterations++;
          } while (previousLoopContent !== loopContent && iterations < maxIterations);

          result += loopContent;
        });
      } else {
        // Para objetos
        for (const [key, value] of Object.entries(array)) {
          // Crear un contexto temporal con las variables del bucle
          const loopContext = { ...data };
          loopContext[keyVar] = key;
          loopContext[valueVar] = value;

          // Procesar el contenido del bucle con el contexto actual
          let loopContent = content;
          
          // Primero procesar las variables del objeto interno (como item.nombre, item.valor)
          if (typeof value === 'object' && value !== null) {
            for (const [propKey, propValue] of Object.entries(value)) {
              const fullKey = `${valueVar}.${propKey}`;
              const escapedKey = fullKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g');
              
              let stringValue;
              if (typeof propValue === 'object' && propValue !== null) {
                stringValue = JSON.stringify(propValue);
              } else {
                stringValue = String(propValue);
              }
              
              loopContent = loopContent.replace(regex, stringValue);
            }
          }

          // Luego procesar las variables generales del contexto
          for (const [k, v] of Object.entries(loopContext)) {
            // Solo procesar variables simples, no las que ya se procesaron como item.prop
            if (typeof v !== 'object' || v === null || Array.isArray(v)) {
              const escapedKey = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g');

              let stringValue;
              if (typeof v === 'object' && v !== null) {
                stringValue = JSON.stringify(v);
              } else {
                stringValue = String(v);
              }

              loopContent = loopContent.replace(regex, stringValue);
            }
          }

          // Procesar condiciones y bucles anidados
          // Aplicar recursivamente el procesamiento para manejar condiciones anidadas
          let previousLoopContent;
          let iterations = 0;
          const maxIterations = 5; // Prevenir bucles infinitos
          
          do {
            previousLoopContent = loopContent;
            loopContent = this.processConditionals(loopContent, loopContext, options);
            loopContent = this.processForeach(loopContent, loopContext, options);
            loopContent = this.replaceVariablesAndFilters(loopContent, loopContext, options);
            iterations++;
          } while (previousLoopContent !== loopContent && iterations < maxIterations);

          result += loopContent;
        }
      }
      
      return result;
    });
  }

  /**
   * Obtiene el valor de una variable, soportando anidación (objeto.propiedad)
   * @param {string} variableName - Nombre de la variable (puede ser anidada)
   * @param {Object} data - Datos donde buscar la variable
   * @returns {*} - Valor de la variable o undefined si no existe
   */
  getVariableValue(variableName, data) {
    // Si no contiene punto, es una variable simple
    if (!variableName.includes('.')) {
      return data[variableName];
    }

    // Si contiene puntos, navegar por las propiedades anidadas
    const parts = variableName.split('.');
    let value = data;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Parsea argumentos de filtros o helpers, respetando cadenas entre comillas
   * @param {string} argsString - Cadena de argumentos
   * @returns {Array} - Array de argumentos parseados
   */
  parseArguments(argsString) {
    const args = [];
    let currentArg = '';
    let inQuotes = false;
    let quoteChar = null;

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = null;
      } else if (char === ',' && !inQuotes) {
        args.push(currentArg.trim());
        currentArg = '';
        continue;
      }

      currentArg += char;
    }

    if (currentArg.trim() !== '') {
      args.push(currentArg.trim());
    }

    // Remover comillas de los argumentos si están presentes
    return args.map(arg => {
      if ((arg.startsWith('"') && arg.endsWith('"')) ||
          (arg.startsWith("'") && arg.endsWith("'"))) {
        return arg.substring(1, arg.length - 1);
      }
      return arg;
    });
  }

  /**
   * Verifica si una vista existe
   * @param {string} viewName - Nombre de la vista
   * @returns {boolean} - Verdadero si la vista existe
   */
  viewExists(viewName) {
    const viewPath = this.getViewPath(viewName);
    return fs.existsSync(viewPath);
  }

  /**
   * Limpia el cache de vistas
   */
  clearCache() {
    this.viewCache.clear();
  }
}

module.exports = ViewEngine;