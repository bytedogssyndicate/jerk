/**
 * Adaptador de almacenamiento para MariaDB - Implementación Real
 * Componente: lib/utils/mariadbTokenAdapter.js
 */

const mariadb = require('mariadb');

class MariaDBTokenAdapter {
  /**
   * Constructor del adaptador
   * @param {Object} config - Configuración de conexión a MariaDB
   */
  constructor(config) {
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 3306,
      user: config.user || 'root',
      password: config.password || '',
      database: config.database || 'token_db',
      connectionLimit: config.connectionLimit || 5
    };
    
    this.pool = null;
    this.tableName = config.tableName || 'tokens';
  }

  /**
   * Inicializa la conexión y la tabla de tokens
   */
  async initialize() {
    try {
      // Crear pool de conexiones
      this.pool = mariadb.createPool(this.config);
      
      // Crear tabla de tokens si no existe
      await this.initializeTable();
      
      console.log('✅ Conexión a MariaDB establecida y tabla de tokens inicializada');
    } catch (error) {
      console.error('❌ Error inicializando MariaDB Token Adapter:', error.message);
      throw error;
    }
  }

  /**
   * Inicializa la tabla de tokens en la base de datos
   */
  async initializeTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(500) UNIQUE NOT NULL,
        user_id INT NOT NULL,
        token_type ENUM('access', 'refresh') DEFAULT 'access',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked BOOLEAN DEFAULT FALSE,
        INDEX idx_user_id (user_id),
        INDEX idx_token (token),
        INDEX idx_expires_at (expires_at)
      )
    `;
    
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(createTableQuery);
      console.log(`✅ Tabla ${this.tableName} inicializada correctamente`);
    } catch (error) {
      console.error('❌ Error inicializando tabla de tokens:', error.message);
      throw error;
    } finally {
      if (conn) conn.release();
    }
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
    
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(insertQuery, [
        token,
        userData.userId || userData.id,
        tokenType,
        expiresAt
      ]);
      
      console.log(`✅ Token ${tokenType} guardado para usuario ${userData.userId || userData.id}`);
    } catch (error) {
      console.error('❌ Error guardando token:', error.message);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Verifica si un token existe y es válido
   * @param {string} token - Token a verificar
   * @returns {Object|null} - Datos del token o null si no es válido
   */
  async validateToken(token) {
    const selectQuery = `
      SELECT * FROM ${this.tableName} 
      WHERE token = ? AND revoked = FALSE AND expires_at > NOW()
    `;
    
    let conn;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(selectQuery, [token]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('❌ Error validando token:', error.message);
      return null;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Revoca un token
   * @param {string} token - Token a revocar
   * @returns {boolean} - True si se revocó exitosamente
   */
  async revokeToken(token) {
    const updateQuery = `
      UPDATE ${this.tableName} 
      SET revoked = TRUE 
      WHERE token = ?
    `;
    
    let conn;
    try {
      conn = await this.pool.getConnection();
      const result = await conn.query(updateQuery, [token]);
      const revoked = result.affectedRows > 0;
      
      if (revoked) {
        console.log(`✅ Token revocado: ${token}`);
      } else {
        console.log(`⚠️  Token no encontrado o ya revocado: ${token}`);
      }
      
      return revoked;
    } catch (error) {
      console.error('❌ Error revocando token:', error.message);
      return false;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Obtiene tokens de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Array} - Array de tokens del usuario
   */
  async getUserTokens(userId) {
    const selectQuery = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = ? AND revoked = FALSE AND expires_at > NOW()
    `;
    
    let conn;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(selectQuery, [userId]);
      return rows;
    } catch (error) {
      console.error('❌ Error obteniendo tokens de usuario:', error.message);
      return [];
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Limpia tokens expirados
   */
  async cleanupExpiredTokens() {
    const deleteQuery = `
      DELETE FROM ${this.tableName} 
      WHERE expires_at <= NOW()
    `;
    
    let conn;
    try {
      conn = await this.pool.getConnection();
      const result = await conn.query(deleteQuery);
      const deletedCount = result.affectedRows;
      
      console.log(`✅ Eliminados ${deletedCount} tokens expirados`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error limpiando tokens expirados:', error.message);
      return 0;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Cierra la conexión al pool
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔒 Conexión a MariaDB cerrada');
    }
  }
}

module.exports = MariaDBTokenAdapter;