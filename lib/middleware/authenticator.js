/**
 * Middleware de autenticación para el framework JERK
 * Implementación extendida del componente middleware/authenticator.js
 * Incluye soporte para OAuth2 y OpenID Connect
 */

class Authenticator {
  /**
   * Constructor del autenticador
   * @param {Object} options - Opciones de configuración
   * @param {Object} options.logger - Instancia de logger para auditoría de seguridad
   */
  constructor(options = {}) {
    this.strategies = new Map();
    this.logger = options.logger || console;
    this.failedAttempts = new Map(); // Para seguimiento de intentos fallidos
    this.blockThreshold = options.blockThreshold || 5; // Número de intentos fallidos antes de bloquear
    this.blockDuration = options.blockDuration || 900000; // Duración del bloqueo en ms (15 min por defecto)
  }

  /**
   * Método para registrar una estrategia de autenticación
   * @param {string} name - Nombre de la estrategia
   * @param {Function} strategy - Función de estrategia de autenticación
   */
  use(name, strategy) {
    this.strategies.set(name, strategy);
  }

  /**
   * Método para crear middleware de autenticación por nombre
   * @param {string} strategyName - Nombre de la estrategia a usar
   * @param {Object} options - Opciones para la estrategia
   * @returns {Function} - Middleware de autenticación
   */
  authenticate(strategyName, options = {}) {
    const strategy = this.strategies.get(strategyName);

    if (!strategy) {
      throw new Error(`Estrategia de autenticación '${strategyName}' no encontrada`);
    }

    return async (req, res, next) => {
      // Obtener IP del cliente para seguimiento
      const clientIP = req.headers['x-forwarded-for'] ||
                      req.connection.remoteAddress ||
                      req.socket.remoteAddress ||
                      (req.connection.socket ? req.connection.socket.remoteAddress : null);

      // Verificar si la IP está bloqueada
      if (this.isBlocked(clientIP)) {
        this.logger.warn(`Intento de autenticación bloqueado desde IP: ${clientIP}`);
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Acceso bloqueado temporalmente por múltiples intentos fallidos' }));
        return false;
      }

      try {
        const isAuthenticated = await strategy(req, options);

        if (isAuthenticated) {
          // Registrar evento de autenticación exitosa
          this.logger.info(`Autenticación exitosa para IP: ${clientIP}, estrategia: ${strategyName}`);

          // Reiniciar contador de intentos fallidos para esta IP
          this.resetFailedAttempts(clientIP);

          if (next) {
            next();
          }
          return true;
        } else {
          // Incrementar contador de intentos fallidos
          this.incrementFailedAttempts(clientIP);

          // Registrar evento de autenticación fallida
          this.logger.warn(`Autenticación fallida para IP: ${clientIP}, estrategia: ${strategyName}`);

          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No autorizado' }));
          return false;
        }
      } catch (error) {
        // Incrementar contador de intentos fallidos
        this.incrementFailedAttempts(clientIP);

        // Registrar evento de error en autenticación
        this.logger.error(`Error en autenticación para IP: ${clientIP}, estrategia: ${strategyName}`, error.message);

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error en la autenticación' }));
        return false;
      }
    };
  }

  /**
   * Estrategia de autenticación por API Key
   * @param {string} headerName - Nombre del header que contiene la API Key
   * @param {Array} validKeys - Array de claves válidas
   * @param {Object} tenantConfig - Configuración por tenant
   * @returns {Function} - Estrategia de autenticación por API Key
   */
  apiKeyStrategy(headerName = 'X-API-Key', validKeys = [], tenantConfig = {}) {
    return (req, options = {}) => {
      const providedKey = req.headers[headerName.toLowerCase()];
      const tenantId = req.headers['x-tenant-id'] || req.headers['tenant']; // Identificador del tenant

      // Si se proporciona un tenantId y existe configuración específica para ese tenant
      if (tenantId && tenantConfig[tenantId]) {
        const tenantKeys = tenantConfig[tenantId].keys || [];
        return new Promise((resolve) => {
          resolve(tenantKeys.includes(providedKey));
        });
      }

      const keys = options.validKeys || validKeys;

      return new Promise((resolve) => {
        resolve(keys.includes(providedKey));
      });
    };
  }

  /**
   * Estrategia de autenticación por JWT
   * @param {string} secret - Secreto para verificar el token
   * @param {Object} options - Opciones adicionales
   * @param {string} options.refreshSecret - Secreto para verificar refresh tokens
   * @param {string} options.storage - Tipo de almacenamiento para tokens ('memory', 'json')
   * @param {string} options.tokenFile - Ruta al archivo JSON para almacenamiento
   * @returns {Function} - Estrategia de autenticación por JWT
   */
  jwtStrategy(secret, options = {}) {
    const refreshSecret = options.refreshSecret || secret; // Usar mismo secreto si no se proporciona uno diferente
    const tokenManager = new (require('../utils/tokenManager'))({
      storage: options.storage || 'memory',
      tokenFile: options.tokenFile
    });

    // Verificar que se haya proporcionado un secreto
    if (!secret) {
      throw new Error('Se requiere un secreto para la estrategia JWT');
    }

    // Importar jsonwebtoken si está disponible
    const jwt = require('jsonwebtoken');

    return async (req, options = {}) => {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
      const jwtSecret = options.secret || secret;

      if (!token) {
        // Verificar si hay un refresh token para renovar el access token
        const refreshToken = req.headers['x-refresh-token'];
        if (refreshToken) {
          try {
            // Usar el token manager para renovar el token
            const renewedTokens = tokenManager.refreshToken(
              refreshToken,
              jwtSecret,
              refreshSecret,
              options.accessTokenExpiration || '15m'
            );

            if (renewedTokens) {
              // Agregar nuevo token a la respuesta para que el cliente lo actualice
              if (req.res) {
                req.res.setHeader('X-New-Access-Token', renewedTokens.accessToken);
              }

              // Decodificar el nuevo token para obtener la información del usuario
              const decoded = jwt.verify(renewedTokens.accessToken, jwtSecret);
              req.user = decoded;
              return Promise.resolve(true);
            }
          } catch (refreshError) {
            return Promise.resolve(false);
          }
        }

        return Promise.resolve(false);
      }

      return new Promise((resolve) => {
        jwt.verify(token, jwtSecret, (err, decoded) => {
          if (err) {
            // Si el token ha expirado, intentar usar refresh token
            if (err.name === 'TokenExpiredError') {
              const refreshToken = req.headers['x-refresh-token'];
              if (refreshToken) {
                const renewedTokens = tokenManager.refreshToken(
                  refreshToken,
                  jwtSecret,
                  refreshSecret,
                  options.accessTokenExpiration || '15m'
                );

                if (renewedTokens) {
                  // Agregar nuevo token a la respuesta para que el cliente lo actualice
                  if (req.res) {
                    req.res.setHeader('X-New-Access-Token', renewedTokens.accessToken);
                  }

                  // Decodificar el nuevo token para obtener la información del usuario
                  const freshDecoded = jwt.verify(renewedTokens.accessToken, jwtSecret);
                  req.user = freshDecoded;
                  resolve(true);
                } else {
                  resolve(false);
                }
              } else {
                resolve(false);
              }
            } else {
              resolve(false);
            }
          } else {
            // Agregar el payload decodificado a la solicitud
            req.user = decoded;
            resolve(true);
          }
        });
      });
    };
  }

  /**
   * Estrategia de autenticación básica
   * @param {Object} credentials - Credenciales válidas { username: password }
   * @returns {Function} - Estrategia de autenticación básica
   */
  basicStrategy(credentials = {}) {
    return (req, options = {}) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return Promise.resolve(false);
      }

      const base64Credentials = authHeader.split(' ')[1];
      const credentialsString = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentialsString.split(':');

      const validCredentials = options.credentials || credentials;

      return new Promise((resolve) => {
        if (validCredentials[username] && validCredentials[username] === password) {
          req.user = { username }; // Agregar usuario a la solicitud
          resolve(true);
        } else {
          resolve(false);
        }
      });
    };
  }

  /**
   * Verifica si una IP está bloqueada por exceso de intentos fallidos
   * @param {string} ip - Dirección IP a verificar
   * @returns {boolean} - Verdadero si la IP está bloqueada
   */
  isBlocked(ip) {
    const record = this.failedAttempts.get(ip);
    if (!record) {
      return false;
    }

    // Verificar si aún está dentro del período de bloqueo
    if (Date.now() - record.firstAttemptTime < this.blockDuration) {
      return record.count >= this.blockThreshold;
    } else {
      // El período de bloqueo ha expirado, eliminar el registro
      this.failedAttempts.delete(ip);
      return false;
    }
  }

  /**
   * Incrementa el contador de intentos fallidos para una IP
   * @param {string} ip - Dirección IP
   */
  incrementFailedAttempts(ip) {
    const record = this.failedAttempts.get(ip);
    if (record) {
      record.count++;
      record.lastAttemptTime = Date.now();
    } else {
      this.failedAttempts.set(ip, {
        count: 1,
        firstAttemptTime: Date.now(),
        lastAttemptTime: Date.now()
      });
    }
  }

  /**
   * Reinicia el contador de intentos fallidos para una IP
   * @param {string} ip - Dirección IP
   */
  resetFailedAttempts(ip) {
    this.failedAttempts.delete(ip);
  }

  /**
   * Obtiene estadísticas de seguridad para una IP
   * @param {string} ip - Dirección IP
   * @returns {Object} - Estadísticas de intentos de autenticación
   */
  getSecurityStats(ip) {
    return this.failedAttempts.get(ip) || { count: 0, blocked: false };
  }

  /**
   * Estrategia de autenticación OAuth2
   * @param {Object} options - Opciones para la estrategia OAuth2
   * @param {string} options.clientId - ID del cliente OAuth2
   * @param {string} options.clientSecret - Secreto del cliente OAuth2
   * @param {string} options.callbackURL - URL de callback para OAuth2
   * @param {string} options.authorizationURL - URL de autorización
   * @param {string} options.tokenURL - URL para obtener token
   * @returns {Function} - Estrategia de autenticación OAuth2
   */
  oauth2Strategy(options = {}) {
    const { clientId, clientSecret, callbackURL, authorizationURL, tokenURL } = options;

    if (!clientId || !clientSecret || !callbackURL || !authorizationURL || !tokenURL) {
      throw new Error('Opciones requeridas para OAuth2: clientId, clientSecret, callbackURL, authorizationURL, tokenURL');
    }

    return async (req, options = {}) => {
      // Verificar si req.session existe (requiere middleware de sesión externo)
      if (!req.session) {
        // Si no hay sesión, verificar si se proporciona token en header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);

          // En una implementación real, aquí verificaríamos el token con el proveedor OAuth2
          // Por ahora, simplemente simulamos la verificación
          try {
            // Simular verificación del token con el proveedor OAuth2
            // En una implementación real, haríamos una solicitud HTTP al proveedor
            // para verificar la validez del token
            req.oauth2User = { token: token, verified: true };
            return Promise.resolve(true);
          } catch (error) {
            return Promise.resolve(false);
          }
        }

        // Si no hay sesión ni token en header, la autenticación falla
        return Promise.resolve(false);
      }

      // Si hay sesión, verificar si ya tenemos un token de acceso
      const accessToken = req.session.accessToken;

      if (accessToken) {
        // Verificar validez del token si es posible
        try {
          // Aquí normalmente haríamos una llamada para verificar el token
          // Por simplicidad en este ejemplo, asumiremos que es válido si existe
          return Promise.resolve(true);
        } catch (error) {
          return Promise.resolve(false);
        }
      }

      // Si no hay token, verificar si estamos en el proceso de callback
      const parsedUrl = require('url').parse(req.url, true);
      const { query } = parsedUrl;

      if (query.code) {
        // Este es el callback con el código de autorización
        try {
          // Intercambiar el código por un token de acceso
          const tokenResponse = await this.exchangeCodeForToken(
            query.code,
            clientId,
            clientSecret,
            callbackURL,
            tokenURL
          );

          // Almacenar el token en la sesión si existe
          if (req.session) {
            req.session.accessToken = tokenResponse.access_token;
            req.session.refreshToken = tokenResponse.refresh_token;
          }

          // Agregar información del usuario a la solicitud
          req.oauth2User = {
            accessToken: tokenResponse.access_token,
            tokenType: tokenResponse.token_type
          };

          return Promise.resolve(true);
        } catch (error) {
          console.error('Error en el proceso de OAuth2:', error);
          return Promise.resolve(false);
        }
      }

      // Si no hay token ni código de autorización, la autenticación falla
      return Promise.resolve(false);
    };
  }

  /**
   * Método auxiliar para intercambiar código por token
   * @private
   */
  async exchangeCodeForToken(code, clientId, clientSecret, callbackURL, tokenURL) {
    const https = require('https');
    const querystring = require('querystring');

    const postData = querystring.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackURL,
      code: code
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(tokenURL, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const tokenResponse = JSON.parse(data);
            resolve(tokenResponse);
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(postData);
      req.end();
    });
  }

  /**
   * Estrategia de autenticación OpenID Connect
   * @param {Object} options - Opciones para la estrategia OIDC
   * @param {string} options.issuer - URL del proveedor OIDC
   * @param {string} options.clientId - ID del cliente OIDC
   * @param {string} options.clientSecret - Secreto del cliente OIDC
   * @param {string} options.callbackURL - URL de callback para OIDC
   * @returns {Function} - Estrategia de autenticación OIDC
   */
  oidcStrategy(options = {}) {
    const { issuer, clientId, clientSecret, callbackURL } = options;

    if (!issuer || !clientId || !clientSecret || !callbackURL) {
      throw new Error('Opciones requeridas para OIDC: issuer, clientId, clientSecret, callbackURL');
    }

    return async (req, options = {}) => {
      // Verificar si ya tenemos un token de ID
      const idToken = req.session ? req.session.idToken : null;

      if (idToken) {
        try {
          // Verificar el token de ID con la biblioteca adecuada
          // Para esta implementación, necesitaríamos jsonwebtoken y jwks-rsa
          const jwt = require('jsonwebtoken');
          const jwksClient = require('jwks-rsa');

          // Obtener la clave pública del proveedor OIDC
          const client = jwksClient({
            jwksUri: `${issuer}/.well-known/jwks.json`
          });

          const getKey = (header, callback) => {
            client.getSigningKey(header.kid, (err, key) => {
              const signingKey = key.publicKey || key.rsaPublicKey;
              callback(null, signingKey);
            });
          };

          return new Promise((resolve) => {
            jwt.verify(idToken, getKey, { 
              audience: clientId,
              issuer: issuer
            }, (err, decoded) => {
              if (err) {
                console.error('Error verificando token OIDC:', err);
                resolve(false);
              } else {
                // Agregar información del usuario a la solicitud
                req.oidcUser = decoded;
                resolve(true);
              }
            });
          });
        } catch (error) {
          console.error('Error en la verificación OIDC:', error);
          return Promise.resolve(false);
        }
      }

      // Si no hay token, verificar si estamos en el proceso de callback
      const parsedUrl = require('url').parse(req.url, true);
      const { query } = parsedUrl;

      if (query.code) {
        // Este es el callback con el código de autorización
        try {
          // Intercambiar el código por tokens
          const tokenResponse = await this.exchangeCodeForToken(
            query.code,
            clientId,
            clientSecret,
            callbackURL,
            `${issuer}/token`
          );
          
          // Verificar y decodificar el ID token
          const idToken = tokenResponse.id_token;
          
          if (idToken) {
            // Almacenar el token en la sesión si existe
            if (req.session) {
              req.session.idToken = idToken;
              req.session.accessToken = tokenResponse.access_token;
            }
            
            // Agregar información del usuario a la solicitud
            const jwt = require('jsonwebtoken');
            req.oidcUser = jwt.decode(idToken);
          }
          
          return Promise.resolve(true);
        } catch (error) {
          console.error('Error en el proceso de OIDC:', error);
          return Promise.resolve(false);
        }
      }

      // Si no hay token ni código de autorización, la autenticación falla
      return Promise.resolve(false);
    };
  }
}

module.exports = Authenticator;