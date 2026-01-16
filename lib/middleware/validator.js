/**
 * Middleware de validación para el framework API SDK
 * Implementación del componente middleware/validator.js
 */

class Validator {
  /**
   * Constructor del validador
   */
  constructor() {
    this.rules = new Map();
  }

  /**
   * Método para crear un middleware de validación
   * @param {Object} schema - Esquema de validación
   * @returns {Function} - Middleware de validación
   */
  validate(schema) {
    return (req, res, next) => {
      const errors = this.validateSchema(req, schema);
      
      if (errors.length > 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Validación fallida',
          details: errors 
        }));
        return;
      }
      
      if (next) {
        next();
      }
    };
  }

  /**
   * Método para validar un esquema contra una solicitud
   * @param {Object} req - Objeto de solicitud HTTP
   * @param {Object} schema - Esquema de validación
   * @returns {Array} - Array de errores de validación
   */
  validateSchema(req, schema) {
    const errors = [];
    
    // Validar campos en query
    if (schema.query) {
      for (const [field, rules] of Object.entries(schema.query)) {
        const value = req.query[field];
        const fieldErrors = this.validateField(value, rules, `query.${field}`);
        errors.push(...fieldErrors);
      }
    }
    
    // Validar campos en params
    if (schema.params) {
      for (const [field, rules] of Object.entries(schema.params)) {
        const value = req.params[field];
        const fieldErrors = this.validateField(value, rules, `params.${field}`);
        errors.push(...fieldErrors);
      }
    }
    
    // Validar campos en body
    if (schema.body) {
      for (const [field, rules] of Object.entries(schema.body)) {
        const value = req.body[field];
        const fieldErrors = this.validateField(value, rules, `body.${field}`);
        errors.push(...fieldErrors);
      }
    }
    
    return errors;
  }

  /**
   * Método para validar un campo individual
   * @param {*} value - Valor a validar
   * @param {Object|Array} rules - Reglas de validación
   * @param {string} fieldName - Nombre del campo para mensajes de error
   * @returns {Array} - Array de errores de validación para este campo
   */
  validateField(value, rules, fieldName) {
    const errors = [];
    
    // Si las reglas son un array, procesar cada regla
    const ruleList = Array.isArray(rules) ? rules : [rules];
    
    for (const rule of ruleList) {
      // Si la regla es una cadena, interpretar como regla predefinida
      if (typeof rule === 'string') {
        const [ruleName, ...params] = rule.split(':');
        const validationFn = this.getValidationRule(ruleName);
        
        if (validationFn) {
          const isValid = validationFn(value, ...params);
          if (!isValid) {
            errors.push(`${fieldName} no cumple con la regla: ${ruleName}`);
          }
        } else {
          errors.push(`Regla de validación desconocida: ${ruleName}`);
        }
      } 
      // Si la regla es una función, ejecutarla directamente
      else if (typeof rule === 'function') {
        try {
          const isValid = rule(value);
          if (!isValid) {
            errors.push(`${fieldName} no pasó la validación personalizada`);
          }
        } catch (error) {
          errors.push(`${fieldName} causó un error en la validación: ${error.message}`);
        }
      }
      // Si la regla es un objeto, asumir que es un esquema anidado
      else if (typeof rule === 'object') {
        if (typeof value === 'object' && value !== null) {
          const nestedErrors = this.validateSchema({ body: value }, { body: rule });
          errors.push(...nestedErrors.map(error => `${fieldName}.${error}`));
        } else {
          errors.push(`${fieldName} debe ser un objeto`);
        }
      }
    }
    
    return errors;
  }

  /**
   * Método para obtener una regla de validación por nombre
   * @param {string} ruleName - Nombre de la regla de validación
   * @returns {Function|null} - Función de validación o null si no existe
   */
  getValidationRule(ruleName) {
    switch (ruleName) {
      case 'required':
        return (value) => value !== undefined && value !== null && value !== '';
      case 'string':
        return (value) => typeof value === 'string';
      case 'number':
        return (value) => typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return (value) => typeof value === 'boolean';
      case 'email':
        return (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'minLength':
        return (value, minLength) => typeof value === 'string' && value.length >= parseInt(minLength);
      case 'maxLength':
        return (value, maxLength) => typeof value === 'string' && value.length <= parseInt(maxLength);
      case 'min':
        return (value, min) => typeof value === 'number' && value >= parseFloat(min);
      case 'max':
        return (value, max) => typeof value === 'number' && value <= parseFloat(max);
      case 'regex':
        return (value, pattern) => {
          try {
            const regex = new RegExp(pattern);
            return typeof value === 'string' && regex.test(value);
          } catch (e) {
            return false;
          }
        };
      case 'array':
        return (value) => Array.isArray(value);
      case 'object':
        return (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return null;
    }
  }

  /**
   * Método para registrar una regla de validación personalizada
   * @param {string} name - Nombre de la regla
   * @param {Function} validationFn - Función de validación
   */
  addRule(name, validationFn) {
    this.rules.set(name, validationFn);
  }

  /**
   * Método para validar un valor con reglas específicas
   * @param {*} value - Valor a validar
   * @param {Array} rules - Array de reglas de validación
   * @returns {Array} - Array de errores de validación
   */
  validateValue(value, rules) {
    return this.validateField(value, rules, 'value');
  }
}

module.exports = Validator;