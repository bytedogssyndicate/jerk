// lib/utils/sqliteTokenAdapter.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SQLiteTokenAdapter {
  /**
   * Constructor del adaptador
   * @param {Object} config - Configuración de conexión
   * @param {string} config.dbPath - Ruta a la base de datos SQLite
   * @param {string} config.tableName - Nombre de la tabla de tokens
   */
  constructor(config) {
    this.dbPath = config.dbPath || './tokens.sqlite';
    this.tableName = config.tableName || 'tokens';
    this.db = null;
  }

  /**
   * Inicializa la conexión y la tabla de tokens
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error conectando a SQLite:', err.message);
          reject(err);
          return;
        }

        console.log(`✅ Conexión a SQLite establecida: ${this.dbPath}`);

        // Crear tabla de tokens si no existe
        this.initializeTable()
          .then(() => {
            console.log(`✅ Tabla ${this.tableName} inicializada correctamente`);
            resolve();
          })
          .catch(reject);
      });
    });
  }

  /**
   * Inicializa la tabla de tokens en la base de datos
   */
  async initializeTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        token_type TEXT DEFAULT 'access',
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        revoked BOOLEAN DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_user_id ON ${this.tableName} (user_id);
      CREATE INDEX IF NOT EXISTS idx_token ON ${this.tableName} (token);
      CREATE INDEX IF NOT EXISTS idx_expires_at ON ${this.tableName} (expires_at);
    `;

    return new Promise((resolve, reject) => {
      this.db.run(createTableQuery, (err) => {
        if (err) {
          console.error('Error inicializando tabla de tokens:', err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Guarda un token en la base de datos
   * @param {string} token - Token a guardar
   * @param {Object} userData - Datos del usuario
   * @param {string} tokenType - Tipo de token ('access' o 'refresh')
   * @param {Date} expiresAt - Fecha de expiración
   */
  async saveToken(token, userData, tokenType = 'access', expiresAt) {
    const insertQuery = `
      INSERT INTO ${this.tableName} (token, user_id, token_type, expires_at) 
      VALUES (?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertQuery, [
        token,
        userData.userId || userData.id,
        tokenType,
        expiresAt.toISOString()
      ], function(err) {
        if (err) {
          console.error('Error guardando token:', err.message);
          reject(err);
        } else {
          console.log(`✅ Token ${tokenType} guardado para usuario ${userData.userId || userData.id}`);
          resolve();
        }
      });
    });
  }

  /**
   * Verifica si un token existe y es válido
   * @param {string} token - Token a verificar
   * @returns {Object|null} - Datos del token o null si no es válido
   */
  async validateToken(token) {
    const selectQuery = `
      SELECT * FROM ${this.tableName} 
      WHERE token = ? AND revoked = 0 AND expires_at > datetime('now')
    `;

    return new Promise((resolve, reject) => {
      this.db.get(selectQuery, [token], (err, row) => {
        if (err) {
          console.error('Error validando token:', err.message);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  /**
   * Revoca un token
   * @param {string} token - Token a revocar
   * @returns {boolean} - True si se revocó exitosamente
   */
  async revokeToken(token) {
    const updateQuery = `
      UPDATE ${this.tableName} 
      SET revoked = 1 
      WHERE token = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.run(updateQuery, [token], function(err) {
        if (err) {
          console.error('Error revocando token:', err.message);
          reject(err);
        } else {
          const revoked = this.changes > 0;
          if (revoked) {
            console.log(`✅ Token revocado: ${token.substring(0, 20)}...`);
          } else {
            console.log(`⚠️  Token no encontrado o ya revocado: ${token.substring(0, 20)}...`);
          }
          resolve(revoked);
        }
      });
    });
  }

  /**
   * Obtiene tokens de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Array} - Array de tokens del usuario
   */
  async getUserTokens(userId) {
    const selectQuery = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = ? AND revoked = 0 AND expires_at > datetime('now')
    `;

    return new Promise((resolve, reject) => {
      this.db.all(selectQuery, [userId], (err, rows) => {
        if (err) {
          console.error('Error obteniendo tokens de usuario:', err.message);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Limpia tokens expirados
   */
  async cleanupExpiredTokens() {
    const deleteQuery = `
      DELETE FROM ${this.tableName} 
      WHERE expires_at <= datetime('now')
    `;

    return new Promise((resolve, reject) => {
      this.db.run(deleteQuery, function(err) {
        if (err) {
          console.error('Error limpiando tokens expirados:', err.message);
          reject(err);
        } else {
          console.log(`✅ Eliminados ${this.changes} tokens expirados`);
          resolve(this.changes);
        }
      });
    });
  }

  /**
   * Cierra la conexión a la base de datos
   */
  async close() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) {
            console.error('Error cerrando conexión a SQLite:', err.message);
            reject(err);
          } else {
            console.log('🔒 Conexión a SQLite cerrada');
            resolve();
          }
        });
      });
    }
  }
}

module.exports = SQLiteTokenAdapter;