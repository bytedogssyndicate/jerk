# Manual de Extensión del Framework API SDK

## Tabla de Contenidos

1. [Introducción a la Extensión del Framework](#introducción-a-la-extensión-del-framework)
2. [Arquitectura de Extensibilidad](#arquitectura-de-extensibilidad)
3. [Patrones de Extensión Comunes](#patrones-de-extensión-comunes)
4. [Ejemplo Práctico: Extensión para SQLite](#ejemplo-práctico-extensión-para-sqlite)
5. [Guía de Implementación](#guía-de-implementación)
6. [Pruebas y Validación](#pruebas-y-validación)
7. [Integración con el Framework](#integración-con-el-framework)
8. [Documentación y Distribución](#documentación-y-distribución)

## Introducción a la Extensión del Framework

El API SDK Framework está diseñado con una arquitectura modular y extensible que permite a los desarrolladores crear extensiones personalizadas para satisfacer necesidades específicas. La extensibilidad es un principio fundamental del framework que permite:

- **Personalización**: Adaptar el framework a necesidades específicas
- **Integración**: Conectar con sistemas y tecnologías externas
- **Reutilización**: Crear componentes reutilizables
- **Mantenibilidad**: Aislar funcionalidades en módulos independientes

## Arquitectura de Extensibilidad

El framework proporciona varias interfaces y patrones para la extensión:

### 1. Patrón de Adaptador
El framework utiliza el patrón de adaptador para permitir diferentes implementaciones de servicios comunes como el almacenamiento de tokens.

### 2. Middleware
Los componentes pueden extenderse mediante middleware que se inserta en el pipeline de procesamiento.

### 3. Estrategias de Autenticación
El sistema de autenticación permite registrar nuevas estrategias personalizadas.

### 4. Sistemas de Carga
Los loaders permiten extender la funcionalidad de carga de rutas y controladores.

## Patrones de Extensión Comunes

### 1. Adaptador de Almacenamiento
Patrón utilizado para diferentes sistemas de almacenamiento (JSON, MariaDB, etc.)

### 2. Middleware Personalizado
Extensión de funcionalidad a través de middleware

### 3. Estrategias de Autenticación
Nuevas formas de autenticar usuarios

### 4. Sistemas de Logging Personalizados
Adaptadores para diferentes sistemas de logging

## Ejemplo Práctico: Extensión para SQLite

Vamos a crear una extensión completa para almacenar tokens en SQLite, siguiendo los mismos patrones que el adaptador de MariaDB.

### 1. Crear el Adaptador de SQLite

Primero, crearemos el archivo para el adaptador de SQLite:

```javascript
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
        revoked BOOLEAN DEFAULT 0,
        INDEX_idx_user_id (user_id),
        INDEX_idx_token (token),
        INDEX_idx_expires_at (expires_at)
      )
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
```

### 2. Instalar la dependencia de SQLite

Para usar SQLite, necesitamos instalar la dependencia:

```bash
npm install sqlite3
```

### 3. Crear un ejemplo de uso

Ahora crearemos un ejemplo que demuestra cómo usar el adaptador de SQLite:

```javascript
// examples/v2/sqlite_tokens_example.js
const { APISDK, Authenticator, Logger } = require('../../index');
const jwt = require('jsonwebtoken');
const SQLiteTokenAdapter = require('../../lib/utils/sqliteTokenAdapter');

// Crear instancia del logger
const logger = new Logger({ level: 'info', timestamp: true });

logger.info('🔐 Iniciando ejemplo con tokens en SQLite');

// Configuración de conexión a SQLite
const dbConfig = {
  dbPath: './tokens.sqlite',  // Ruta a la base de datos SQLite
  tableName: 'tokens'
};

// Crear instancia del adaptador de tokens
const tokenAdapter = new SQLiteTokenAdapter(dbConfig);

// Inicializar la conexión y tabla
tokenAdapter.initialize()
  .then(async () => {
    logger.info('✅ Conexión a SQLite establecida');

    // Crear instancia del servidor
    const server = new APISDK({
      port: 8083,
      host: 'localhost'
    });

    // Crear instancia del autenticador
    const authenticator = new Authenticator({ logger: logger });

    // Secretos para tokens
    const jwtSecret = 'sqlite-jwt-secret-key';
    const refreshSecret = 'sqlite-refresh-secret-key';

    // Estrategia de autenticación con tokens en SQLite
    authenticator.use('sqliteJwt', async (req, options = {}) => {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return false;
      }

      try {
        // Primero verificar si el token es válido en la base de datos
        const tokenRecord = await tokenAdapter.validateToken(token);
        
        if (!tokenRecord) {
          return false;
        }

        // Luego verificar si el token JWT es válido
        const decoded = jwt.verify(token, jwtSecret);
        
        // Agregar el payload decodificado a la solicitud
        req.user = decoded;
        return true;
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          // Token expirado, verificar si hay refresh token
          const refreshToken = req.headers['x-refresh-token'];
          if (refreshToken) {
            const refreshRecord = await tokenAdapter.validateToken(refreshToken);
            if (refreshRecord && refreshRecord.token_type === 'refresh') {
              try {
                // Decodificar el refresh token para obtener los datos del usuario
                const refreshDecoded = jwt.verify(refreshToken, refreshSecret);
                
                // Generar nuevo token de acceso
                const newAccessToken = jwt.sign(
                  { 
                    userId: refreshDecoded.userId || refreshDecoded.id,
                    username: refreshDecoded.username,
                    role: refreshDecoded.role,
                    tokenType: 'access' 
                  },
                  jwtSecret,
                  { expiresIn: '15m' }
                );
                
                // Guardar nuevo token de acceso en la base de datos
                const accessExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
                await tokenAdapter.saveToken(
                  newAccessToken, 
                  refreshDecoded, 
                  'access', 
                  accessExpiresAt
                );
                
                // Agregar nuevo token a la respuesta para que el cliente lo actualice
                if (req.res) {
                  req.res.setHeader('X-New-Access-Token', newAccessToken);
                }
                
                // Agregar el payload decodificado a la solicitud
                req.user = refreshDecoded;
                return true;
              } catch (verifyError) {
                return false;
              }
            } else {
              return false;
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      }
    });

    // Middleware para adjuntar la respuesta al request para headers
    server.use((req, res, next) => {
      req.res = res;
      next();
    });

    // Simulación de base de datos de usuarios
    const users = [
      { id: 1, username: 'sqlite_admin', password: 'password', role: 'admin' },
      { id: 2, username: 'sqlite_user', password: 'password', role: 'user' }
    ];

    // Ruta de login para generar tokens en SQLite
    server.addRoute('POST', '/api/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        
        // Validar credenciales
        const user = users.find(u => u.username === username && u.password === password);
        
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Credenciales inválidas'
          }));
          return;
        }
        
        // Generar tokens JWT
        const accessToken = jwt.sign(
          { 
            userId: user.id, 
            username: user.username, 
            role: user.role, 
            tokenType: 'access' 
          },
          jwtSecret,
          { expiresIn: '15m' }
        );
        
        const refreshToken = jwt.sign(
          { 
            userId: user.id, 
            username: user.username, 
            role: user.role, 
            tokenType: 'refresh' 
          },
          refreshSecret,
          { expiresIn: '7d' }
        );
        
        // Guardar tokens en la base de datos SQLite
        const accessExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
        
        await tokenAdapter.saveToken(accessToken, user, 'access', accessExpiresAt);
        await tokenAdapter.saveToken(refreshToken, user, 'refresh', refreshExpiresAt);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Login exitoso',
          tokens: {
            accessToken,
            refreshToken
          },
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        }));
      } catch (error) {
        logger.error('Error en login:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Error en el proceso de login'
        }));
      }
    });

    // Ruta para renovar tokens
    server.addRoute('POST', '/api/refresh', async (req, res) => {
      try {
        const refreshToken = req.headers['x-refresh-token'];
        
        if (!refreshToken) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Refresh token requerido'
          }));
          return;
        }
        
        // Verificar si el refresh token es válido en la base de datos
        const tokenRecord = await tokenAdapter.validateToken(refreshToken);
        
        if (!tokenRecord || tokenRecord.token_type !== 'refresh') {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Refresh token inválido o expirado'
          }));
          return;
        }
        
        try {
          // Decodificar el refresh token para obtener los datos del usuario
          const decoded = jwt.verify(refreshToken, refreshSecret);
          
          // Generar nuevo token de acceso
          const newAccessToken = jwt.sign(
            { 
              userId: decoded.userId || decoded.id,
              username: decoded.username,
              role: decoded.role,
              tokenType: 'access' 
            },
            jwtSecret,
            { expiresIn: '15m' }
          );
          
          // Guardar nuevo token de acceso en la base de datos
          const accessExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
          await tokenAdapter.saveToken(newAccessToken, decoded, 'access', accessExpiresAt);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Tokens renovados exitosamente',
            tokens: {
              accessToken: newAccessToken,
              refreshToken: refreshToken // Devolver el mismo refresh token
            }
          }));
        } catch (verifyError) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Refresh token inválido'
          }));
        }
      } catch (error) {
        logger.error('Error al renovar token:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Error al renovar token'
        }));
      }
    });

    // Ruta protegida con tokens de SQLite
    server.addRoute('GET', '/api/data', authenticator.authenticate('sqliteJwt'), (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Datos protegidos accesados con token de SQLite',
        user: req.user,
        data: {
          id: 1,
          title: 'Datos de SQLite',
          content: 'Este contenido está protegido por tokens almacenados en SQLite',
          timestamp: new Date().toISOString()
        }
      }));
    });

    // Ruta de perfil protegida
    server.addRoute('GET', '/api/profile', authenticator.authenticate('sqliteJwt'), (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Perfil obtenido con token de SQLite',
        user: req.user
      }));
    });

    // Middleware de logging
    server.use((req, res, next) => {
      logger.info(`${req.method} ${req.url} - IP: ${req.connection.remoteAddress}`);
      next();
    });

    logger.info('✅ Rutas configuradas con tokens en SQLite');

    // Iniciar el servidor
    const httpServer = server.start();

    logger.info('✅ Servidor iniciado en http://localhost:8083');
    logger.info('📋 Endpoints disponibles:');
    logger.info('   POST /api/login    - Login para tokens en SQLite');
    logger.info('   POST /api/refresh - Renovar tokens');
    logger.info('   GET  /api/data     - Datos (JWT req)');
    logger.info('   GET  /api/profile - Perfil (JWT req)');

    logger.info('\n🔧 Comandos de prueba con curl:');
    logger.info('   # Login para obtener tokens en SQLite:');
    logger.info('   curl -X POST http://localhost:8083/api/login \\');
    logger.info('        -H "Content-Type: application/json" \\');
    logger.info('        -d \'{"username":"sqlite_admin", "password":"password"}\'');
    logger.info('');
    logger.info('   # Acceder a datos protegidos (reemplaza con tu JWT):');
    logger.info('   curl -H "Authorization: Bearer TU_JWT_TOKEN_AQUI" http://localhost:8083/api/data');
    logger.info('');
    logger.info('   # Renovar tokens (reemplaza con tu refresh token):');
    logger.info('   curl -X POST http://localhost:8083/api/refresh \\');
    logger.info('        -H "X-Refresh-Token: TU_REFRESH_TOKEN_AQUI"');

    // Manejo de cierre
    const gracefulShutdown = async () => {
      logger.info('🛑 Cerrando servidor...');
      httpServer.close(() => {
        logger.info('🔌 Servidor detenido');
        
        // Cerrar conexión a SQLite
        tokenAdapter.close()
          .then(() => {
            logger.info('🔒 Conexión a SQLite cerrada');
            process.exit(0);
          })
          .catch(err => {
            console.error('Error cerrando conexión a SQLite:', err.message);
            process.exit(1);
          });
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  })
  .catch(error => {
    logger.error('❌ Error inicializando adaptador de tokens:', error.message);
    process.exit(1);
  });
```

### 4. Actualizar el package.json

Agregamos la dependencia de SQLite al package.json:

```json
{
  "name": "apisdk",
  "version": "1.0.0",
  "description": "Framework para agilizar la creación de APIs",
  "main": "index.js",
  "scripts": {
    "start": "node examples/basic/server.js",
    "test": "echo \"Error: no test specified\" && exit 1",
    "build": "mkdir -p dist && cp -r lib index.js package.json README.md examples dist/",
    "example:v2:security": "node examples/v2/advanced_security_example.js",
    "example:v2:nested": "node examples/v2/nested_routes_example.js",
    "example:v2:full": "node examples/v2/full_features_example.js",
    "example:v2:auth": "node examples/v2/advanced_auth_example.js",
    "example:v2:routes": "node examples/v2/routes_json_example.js",
    "example:v2:sqlite": "node examples/v2/sqlite_tokens_example.js"
  },
  "keywords": [
    "api",
    "framework",
    "server",
    "routing"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "jsonwebtoken": "^9.0.0",
    "sqlite3": "^5.1.6"
  }
}
```

### 5. Actualizar el index.js para exportar el nuevo adaptador

```javascript
// Actualizar index.js para incluir el adaptador de SQLite
const APISDK = require('./lib/core/server');
const Router = require('./lib/core/router');
const HandlerManager = require('./lib/core/handler');
const Authenticator = require('./lib/middleware/authenticator');
const Validator = require('./lib/middleware/validator');
const RouteLoader = require('./lib/loader/routeLoader');
const ControllerLoader = require('./lib/loader/controllerLoader');
const ConfigParser = require('./lib/utils/configParser');
const { Logger } = require('./lib/utils/logger');

// Componentes adicionales de la versión 2.0
const Cors = require('./lib/middleware/cors');
const RateLimiter = require('./lib/middleware/rateLimiter');
const Compressor = require('./lib/middleware/compressor');
const TokenManager = require('./lib/utils/tokenManager');
const MariaDBTokenAdapter = require('./lib/utils/mariadbTokenAdapter');
const SQLiteTokenAdapter = require('./lib/utils/sqliteTokenAdapter'); // Nuevo adaptador

module.exports = {
  // Componentes fundamentales (v1.0)
  APISDK,
  Router,
  HandlerManager,
  Authenticator,
  Validator,
  RouteLoader,
  ControllerLoader,
  ConfigParser,
  Logger,
  
  // Componentes de seguridad y rendimiento (v2.0)
  Cors,
  RateLimiter,
  Compressor,
  
  // Componentes de utilidad (v2.0)
  TokenManager,
  MariaDBTokenAdapter,
  SQLiteTokenAdapter  // Exportar el nuevo adaptador
};

// También exportar clases individuales por conveniencia
module.exports.APISDK = APIServer;
```

## Guía de Implementación

### Paso 1: Analizar los Requisitos

Antes de crear cualquier extensión, es importante:

1. **Definir el propósito**: ¿Qué problema resolverá la extensión?
2. **Identificar los puntos de integración**: ¿Dónde se integrará con el framework?
3. **Definir la interfaz**: ¿Qué métodos/propiedades debe implementar?
4. **Considerar la compatibilidad**: ¿Cómo se integrará con versiones existentes?

### Paso 2: Implementar el Patrón de Adaptador

El patrón de adaptador es clave para la extensibilidad:

```javascript
// Plantilla para nuevos adaptadores
class NuevoAdaptador {
  constructor(config) {
    // Inicializar con configuración
  }

  async initialize() {
    // Lógica de inicialización
  }

  // Métodos comunes que deben implementarse
  async save(data) { /* ... */ }
  async get(id) { /* ... */ }
  async validate(data) { /* ... */ }
  async close() { /* ... */ }
}
```

### Paso 3: Asegurar la Consistencia de la API

Mantener una API consistente con otros componentes del framework:

- Usar los mismos patrones de nomenclatura
- Mantener la misma estructura de callbacks/promesas
- Seguir las mismas convenciones de manejo de errores
- Proporcionar mensajes de log consistentes

### Paso 4: Implementar la Lógica de Negocio

Implementar la funcionalidad específica del nuevo sistema:

- Conexión y desconexión
- Operaciones CRUD básicas
- Manejo de errores específicos del sistema
- Optimizaciones de rendimiento

### Paso 5: Probar la Integración

Verificar que la extensión funcione correctamente con el framework:

- Pruebas unitarias de los métodos del adaptador
- Pruebas de integración con el sistema de autenticación
- Pruebas de rendimiento y seguridad
- Pruebas de compatibilidad con diferentes versiones

## Pruebas y Validación

### Pruebas Unitarias

```javascript
// test_sqlite_adapter.js
const assert = require('assert');
const SQLiteTokenAdapter = require('./lib/utils/sqliteTokenAdapter');

describe('SQLiteTokenAdapter', () => {
  let adapter;

  beforeEach(async () => {
    adapter = new SQLiteTokenAdapter({ dbPath: ':memory:' }); // Usar memoria para pruebas
    await adapter.initialize();
  });

  afterEach(async () => {
    await adapter.close();
  });

  it('debería guardar y validar tokens correctamente', async () => {
    const token = 'test-token';
    const userData = { userId: 1, username: 'testuser' };
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora

    await adapter.saveToken(token, userData, 'access', expiresAt);
    const result = await adapter.validateToken(token);

    assert.ok(result);
    assert.equal(result.user_id, 1);
    assert.equal(result.token_type, 'access');
  });

  it('debería revocar tokens correctamente', async () => {
    const token = 'test-token-revoke';
    const userData = { userId: 1, username: 'testuser' };
    const expiresAt = new Date(Date.now() + 3600000);

    await adapter.saveToken(token, userData, 'access', expiresAt);
    const revoked = await adapter.revokeToken(token);
    
    assert.ok(revoked);
    
    const validated = await adapter.validateToken(token);
    assert.ok(!validated);
  });
});
```

### Pruebas de Integración

```javascript
// test_integration.js
const { APISDK, Authenticator } = require('./index');
const SQLiteTokenAdapter = require('./lib/utils/sqliteTokenAdapter');

async function testIntegration() {
  const adapter = new SQLiteTokenAdapter({ dbPath: './integration_test.sqlite' });
  await adapter.initialize();

  const server = new APISDK({ port: 9999 });
  const authenticator = new Authenticator();

  // Registrar estrategia con SQLite
  authenticator.use('sqliteAuth', async (req) => {
    // Implementación de autenticación con SQLite
  });

  // Agregar rutas y probar la funcionalidad
  // ...
}
```

## Integración con el Framework

### 1. Registro de Componentes

Asegurar que la extensión esté disponible a través del punto de entrada:

```javascript
// index.js - Ya implementado arriba
module.exports.SQLiteTokenAdapter = require('./lib/utils/sqliteTokenAdapter');
```

### 2. Documentación de la API

Proporcionar documentación clara sobre cómo usar la extensión:

```javascript
/**
 * Uso del adaptador de SQLite
 */
const { APISDK, Authenticator, SQLiteTokenAdapter } = require('apisdk');

const adapter = new SQLiteTokenAdapter({
  dbPath: './tokens.sqlite',
  tableName: 'tokens'
});

await adapter.initialize();

// Usar en autenticación
authenticator.use('sqliteJwt', (req) => {
  // Lógica de autenticación con SQLite
});
```

### 3. Ejemplos de Uso

Proporcionar ejemplos completos que demuestren el uso de la extensión.

## Documentación y Distribución

### 1. Documentación del API

Crear documentación detallada de todos los métodos y opciones disponibles.

### 2. Guía de Instalación

Explicar cómo instalar y configurar la extensión.

### 3. Ejemplos Prácticos

Mostrar casos de uso reales y escenarios comunes.

### 4. Pruebas y Validación

Incluir pruebas que demuestren la funcionalidad y rendimiento.

## Consideraciones de Seguridad

Al crear extensiones, especialmente para almacenamiento de datos sensibles como tokens:

1. **Validación de Entrada**: Validar todos los datos antes de almacenarlos
2. **Escapado de Consultas**: Usar consultas preparadas para prevenir inyección SQL
3. **Cifrado**: Considerar cifrar datos sensibles si es necesario
4. **Auditoría**: Registrar operaciones importantes para fines de auditoría
5. **Límites**: Implementar límites para prevenir abusos

## Buenas Prácticas

1. **Seguir Convenciones**: Mantener consistencia con el resto del framework
2. **Manejo de Errores**: Proporcionar mensajes de error claros y útiles
3. **Rendimiento**: Optimizar operaciones para minimizar impacto en el rendimiento
4. **Documentación**: Documentar claramente la API y casos de uso
5. **Pruebas**: Incluir pruebas unitarias e integración
6. **Compatibilidad**: Mantener compatibilidad hacia atrás cuando sea posible

## Conclusión

La extensibilidad es una característica poderosa del API SDK Framework que permite adaptarlo a necesidades específicas. Al seguir los patrones y prácticas descritos en este manual, puedes crear extensiones robustas, seguras y fáciles de mantener que se integran perfectamente con el framework existente.

El ejemplo de SQLite demuestra cómo crear una extensión completa que sigue todos los principios de diseño del framework, manteniendo la consistencia de la API y proporcionando funcionalidad adicional de manera segura y eficiente.