/**
 * Sistema de gestión de tokens para el framework API SDK
 * Implementación del componente utils/tokenManager.js
 */

const fs = require('fs');
const jwt = require('jsonwebtoken');

class TokenManager {
  /**
   * Constructor del gestor de tokens
   * @param {Object} options - Opciones de configuración
   * @param {string} options.storage - Tipo de almacenamiento ('memory', 'json', 'database')
   * @param {string} options.tokenFile - Ruta al archivo JSON para almacenamiento
   * @param {Object} options.dbConfig - Configuración para base de datos (si aplica)
   */
  constructor(options = {}) {
    this.storage = options.storage || 'memory';
    this.tokenFile = options.tokenFile || './tokens.json';
    this.dbConfig = options.dbConfig;
    
    // Inicializar almacenamiento
    this.tokens = new Map();
    
    if (this.storage === 'json') {
      this.initJsonStorage();
    }
  }

  /**
   * Inicializa el almacenamiento JSON
   */
  initJsonStorage() {
    try {
      if (fs.existsSync(this.tokenFile)) {
        const data = fs.readFileSync(this.tokenFile, 'utf8');
        const jsonData = JSON.parse(data);
        
        // Convertir objeto a Map
        for (const [key, value] of Object.entries(jsonData)) {
          this.tokens.set(key, value);
        }
      } else {
        // Crear archivo con estructura vacía
        fs.writeFileSync(this.tokenFile, JSON.stringify({}, null, 2));
      }
    } catch (error) {
      console.error('Error inicializando almacenamiento JSON:', error.message);
      // Inicializar con estructura vacía
      this.tokens = new Map();
      fs.writeFileSync(this.tokenFile, JSON.stringify({}, null, 2));
    }
  }

  /**
   * Guarda tokens en almacenamiento JSON
   */
  saveToJson() {
    if (this.storage === 'json') {
      const jsonObj = {};
      for (const [key, value] of this.tokens) {
        jsonObj[key] = value;
      }
      fs.writeFileSync(this.tokenFile, JSON.stringify(jsonObj, null, 2));
    }
  }

  /**
   * Genera un nuevo token JWT
   * @param {Object} payload - Payload del token
   * @param {string} secret - Secreto para firmar el token
   * @param {string|number} expiresIn - Tiempo de expiración
   * @returns {string} - Token generado
   */
  generateToken(payload, secret, expiresIn = '1h') {
    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * Genera un par de tokens (access y refresh)
   * @param {Object} userData - Datos del usuario
   * @param {Object} options - Opciones de generación
   * @returns {Object} - Objeto con ambos tokens
   */
  generateTokenPair(userData, options = {}) {
    const {
      jwtSecret,
      refreshSecret,
      accessExpiresIn = '15m',
      refreshExpiresIn = '7d'
    } = options;

    // Validar que los secrets estén definidos
    if (!jwtSecret) {
      throw new Error('Se requiere jwtSecret para generar el token de acceso');
    }
    if (!refreshSecret) {
      throw new Error('Se requiere refreshSecret para generar el token de refresco');
    }

    const accessToken = this.generateToken(
      { ...userData, tokenType: 'access' },
      jwtSecret,
      accessExpiresIn
    );

    const refreshToken = this.generateToken(
      { ...userData, tokenType: 'refresh' },
      refreshSecret,
      refreshExpiresIn
    );

    // Almacenar refresh token si es necesario para revocación
    if (this.storage !== 'memory') {
      this.tokens.set(refreshToken, {
        userId: userData.userId || userData.id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.parseTimeToMs(refreshExpiresIn)).toISOString(),
        revoked: false
      });
      
      if (this.storage === 'json') {
        this.saveToJson();
      }
    }

    return {
      accessToken,
      refreshToken
    };
  }

  /**
   * Valida un token JWT
   * @param {string} token - Token a validar
   * @param {string} secret - Secreto para verificar el token
   * @returns {Object|null} - Payload decodificado o null si inválido
   */
  validateToken(token, secret) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Renueva un token de acceso usando un refresh token
   * @param {string} refreshToken - Refresh token
   * @param {string} jwtSecret - Secreto JWT
   * @param {string} refreshSecret - Secreto refresh
   * @param {string} accessExpiresIn - Tiempo expiración access token
   * @returns {Object|null} - Nuevo par de tokens o null si inválido
   */
  refreshToken(refreshToken, jwtSecret, refreshSecret, accessExpiresIn = '15m') {
    // Primero verificar si el refresh token es válido
    const decoded = this.validateToken(refreshToken, refreshSecret);

    if (!decoded) {
      return null;
    }

    // Si usamos almacenamiento persistente, verificar si el token está revocado
    if (this.storage !== 'memory') {
      const storedToken = this.tokens.get(refreshToken);
      if (!storedToken || storedToken.revoked) {
        return null;
      }
    }

    // Crear un nuevo payload sin las propiedades de expiración del refresh token
    const newPayload = { ...decoded };
    delete newPayload.exp;  // Eliminar expiración del refresh token
    delete newPayload.iat;  // Eliminar emisión del refresh token
    delete newPayload.tokenType; // Asegurarse de que sea un token de acceso

    // Generar nuevo token de acceso con los datos del usuario
    const newAccessToken = this.generateToken(
      { ...newPayload, tokenType: 'access' },
      jwtSecret,
      accessExpiresIn
    );

    return {
      accessToken: newAccessToken,
      refreshToken // Devolver el mismo refresh token (o generar uno nuevo si se implementa rotación)
    };
  }

  /**
   * Revoca un refresh token
   * @param {string} refreshToken - Refresh token a revocar
   * @returns {boolean} - True si se revocó exitosamente
   */
  revokeToken(refreshToken) {
    if (this.storage !== 'memory') {
      const storedToken = this.tokens.get(refreshToken);
      if (storedToken) {
        storedToken.revoked = true;
        storedToken.revokedAt = new Date().toISOString();
        
        if (this.storage === 'json') {
          this.saveToJson();
        }
        
        return true;
      }
    }
    return false;
  }

  /**
   * Parsea una duración de tiempo a milisegundos
   * @param {string|number} time - Tiempo en formato legible (ej: '1h', '7d', '30m')
   * @returns {number} - Milisegundos
   */
  parseTimeToMs(time) {
    if (typeof time === 'number') return time;
    
    const timeStr = time.toString();
    const num = parseInt(timeStr.match(/\d+/)[0]);
    const unit = timeStr.match(/[a-z]+/i)[0].toLowerCase();
    
    switch (unit) {
      case 's': return num * 1000;
      case 'm': return num * 60 * 1000;
      case 'h': return num * 60 * 60 * 1000;
      case 'd': return num * 24 * 60 * 60 * 1000;
      default: return num * 1000; // Por defecto segundos
    }
  }

  /**
   * Obtiene tokens válidos para un usuario
   * @param {string|number} userId - ID del usuario
   * @returns {Array} - Array de tokens asociados al usuario
   */
  getUserTokens(userId) {
    const userTokens = [];
    
    for (const [token, data] of this.tokens) {
      if (data.userId == userId && !data.revoked) {
        userTokens.push({
          token,
          ...data
        });
      }
    }
    
    return userTokens;
  }
}

module.exports = TokenManager;