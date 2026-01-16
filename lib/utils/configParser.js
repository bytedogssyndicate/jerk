/**
 * Parser de configuración para el framework JERK
 * Implementación del componente utils/configParser.js
 */

const fs = require('fs');
const path = require('path');

class ConfigParser {
  /**
   * Constructor del parser de configuración
   */
  constructor() {
    this.config = {};
  }

  /**
   * Método para cargar configuración desde un archivo JSON
   * @param {string} filePath - Ruta al archivo de configuración
   * @returns {Object} - Configuración cargada
   */
  loadFromFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Archivo de configuración no encontrado: ${filePath}`);
      }

      const configData = fs.readFileSync(filePath, 'utf8');
      const parsedConfig = JSON.parse(configData);
      
      this.config = { ...this.config, ...parsedConfig };
      return this.config;
    } catch (error) {
      throw new Error(`Error cargando configuración desde ${filePath}: ${error.message}`);
    }
  }

  /**
   * Método para cargar configuración desde variables de entorno
   * @param {Object} env - Objeto con variables de entorno (por defecto process.env)
   * @param {Object} mapping - Objeto que mapea variables de entorno a claves de configuración
   * @returns {Object} - Configuración actualizada
   */
  loadFromEnv(env = process.env, mapping = {}) {
    const envConfig = {};

    // Si se proporciona un mapeo, usarlo para leer variables de entorno
    if (Object.keys(mapping).length > 0) {
      for (const [configKey, envVar] of Object.entries(mapping)) {
        if (env[envVar] !== undefined) {
          envConfig[configKey] = this.parseEnvValue(env[envVar]);
        }
      }
    } else {
      // Si no hay mapeo, buscar variables con prefijo API_
      for (const [key, value] of Object.entries(env)) {
        if (key.startsWith('API_')) {
          const configKey = this.snakeToCamel(key.substring(4).toLowerCase()); // Remover API_ y convertir
          envConfig[configKey] = this.parseEnvValue(value);
        }
      }
    }

    this.config = { ...this.config, ...envConfig };
    return this.config;
  }

  /**
   * Método para parsear valores de variables de entorno
   * @param {string} value - Valor de la variable de entorno
   * @returns {*} - Valor parseado (string, number, boolean, etc.)
   */
  parseEnvValue(value) {
    // Intentar parsear como booleano
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // Intentar parsear como número
    if (!isNaN(value) && value.trim() !== '') {
      const numValue = Number(value);
      if (!isNaN(numValue)) return numValue;
    }
    
    // Si contiene comas, podría ser un array
    if (value.includes(',')) {
      return value.split(',').map(item => this.parseEnvValue(item.trim()));
    }
    
    // Por defecto, retornar como string
    return value;
  }

  /**
   * Método para convertir snake_case a camelCase
   * @param {string} str - Cadena en formato snake_case
   * @returns {string} - Cadena en formato camelCase
   */
  snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  /**
   * Método para cargar configuración por defecto
   * @param {Object} defaults - Configuración por defecto
   * @returns {Object} - Configuración actualizada
   */
  loadDefaults(defaults) {
    this.config = { ...defaults, ...this.config };
    return this.config;
  }

  /**
   * Método para obtener un valor de configuración
   * @param {string} key - Clave de la configuración (puede usar notación de punto para objetos anidados)
   * @param {*} defaultValue - Valor por defecto si no se encuentra la clave
   * @returns {*} - Valor de la configuración
   */
  get(key, defaultValue = undefined) {
    // Soportar notación de punto para acceder a propiedades anidadas
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value === null || value === undefined || typeof value !== 'object') {
        return defaultValue;
      }
      value = value[k];
    }
    
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Método para establecer un valor de configuración
   * @param {string} key - Clave de la configuración (puede usar notación de punto para objetos anidados)
   * @param {*} value - Valor a establecer
   */
  set(key, value) {
    // Soportar notación de punto para establecer propiedades anidadas
    const keys = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (current[k] === undefined || current[k] === null) {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Método para obtener toda la configuración
   * @returns {Object} - Objeto con toda la configuración
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Método para reiniciar la configuración
   */
  reset() {
    this.config = {};
  }

  /**
   * Método para validar la configuración contra un esquema
   * @param {Object} schema - Esquema de validación
   * @returns {Array} - Array de errores de validación
   */
  validate(schema) {
    const errors = [];
    
    for (const [key, rules] of Object.entries(schema)) {
      const value = this.get(key);
      
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`Campo requerido: ${key}`);
        continue;
      }
      
      if (value !== undefined && rules.type) {
        const valueType = typeof value;
        if (rules.type === 'array' && !Array.isArray(value)) {
          errors.push(`Campo ${key} debe ser un array`);
        } else if (rules.type !== 'array' && valueType !== rules.type) {
          errors.push(`Campo ${key} debe ser de tipo ${rules.type}, pero es ${valueType}`);
        }
      }
      
      if (value !== undefined && rules.validator && typeof rules.validator === 'function') {
        const isValid = rules.validator(value);
        if (!isValid) {
          errors.push(`Campo ${key} no pasó la validación personalizada`);
        }
      }
    }
    
    return errors;
  }

  /**
   * Método para guardar la configuración en un archivo
   * @param {string} filePath - Ruta al archivo donde guardar la configuración
   */
  saveToFile(filePath) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      throw new Error(`Error guardando configuración en ${filePath}: ${error.message}`);
    }
  }
}

module.exports = ConfigParser;