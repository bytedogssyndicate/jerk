/**
 * Middleware de sesión para el framework API SDK
 * Implementación del componente middleware/session.js
 */

const crypto = require('crypto');

class SessionManager {
  constructor(options = {}) {
    this.sessions = new Map(); // Almacenamiento en memoria de sesiones
    this.cookieName = options.cookieName || 'sessionId';
    this.secret = options.secret || 'default-session-secret-change-me';
    this.timeout = options.timeout || 3600000; // 1 hora por defecto

    // Obtener instancia de hooks del framework
    try {
      const framework = require('../../index.js');
      this.hooks = framework.hooks;
    } catch (error) {
      // Si no está disponible, crear instancia local
      const HookSystem = require('../core/hooks');
      this.hooks = new HookSystem();
    }
  }

  /**
   * Genera un ID de sesión seguro
   * @returns {string} - ID de sesión generado
   */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Crea una nueva sesión
   * @param {Object} userData - Datos del usuario para almacenar en la sesión
   * @returns {string} - ID de la sesión creada
   */
  createSession(userData) {
    // Permitir que otros módulos modifiquen los datos de la sesión antes de crearla
    const processedUserData = this.hooks.applyFilters('session_create_data', userData);

    const sessionId = this.generateSessionId();
    const sessionData = {
      id: sessionId,
      data: processedUserData,
      createdAt: Date.now(),
      lastAccessed: Date.now()
    };

    this.sessions.set(sessionId, sessionData);

    // Disparar hook después de crear la sesión
    this.hooks.doAction('session_created', sessionId, sessionData);

    return sessionId;
  }

  /**
   * Obtiene los datos de una sesión
   * @param {string} sessionId - ID de la sesión
   * @returns {Object|null} - Datos de la sesión o null si no existe
   */
  getSession(sessionId) {
    if (!sessionId) {
      // Disparar hook cuando se intenta obtener una sesión sin ID
      this.hooks.doAction('session_get_no_id');
      return null;
    }

    // Permitir que otros módulos modifiquen el ID de sesión antes de buscarla
    const processedSessionId = this.hooks.applyFilters('session_get_id', sessionId);

    const session = this.sessions.get(processedSessionId);
    if (!session) {
      // Disparar hook cuando no se encuentra la sesión
      this.hooks.doAction('session_not_found', processedSessionId);
      return null;
    }

    // Verificar si la sesión ha expirado
    if (Date.now() - session.lastAccessed > this.timeout) {
      this.destroySession(processedSessionId);
      // Disparar hook cuando la sesión ha expirado
      this.hooks.doAction('session_expired', processedSessionId);
      return null;
    }

    // Actualizar último acceso
    session.lastAccessed = Date.now();
    this.sessions.set(processedSessionId, session);

    // Disparar hook después de obtener la sesión
    this.hooks.doAction('session_retrieved', processedSessionId, session.data);

    return session.data;
  }

  /**
   * Actualiza los datos de una sesión
   * @param {string} sessionId - ID de la sesión
   * @param {Object} newData - Nuevos datos para la sesión
   * @returns {boolean} - True si la actualización fue exitosa
   */
  updateSession(sessionId, newData) {
    // Permitir que otros módulos modifiquen los nuevos datos antes de actualizar
    const processedNewData = this.hooks.applyFilters('session_update_data', newData, sessionId);

    const session = this.sessions.get(sessionId);
    if (!session) {
      // Disparar hook cuando se intenta actualizar una sesión inexistente
      this.hooks.doAction('session_update_failed', sessionId, processedNewData);
      return false;
    }

    session.data = { ...session.data, ...processedNewData };
    session.lastAccessed = Date.now();
    this.sessions.set(sessionId, session);

    // Disparar hook después de actualizar la sesión
    this.hooks.doAction('session_updated', sessionId, session.data);

    return true;
  }

  /**
   * Destruye una sesión
   * @param {string} sessionId - ID de la sesión a destruir
   * @returns {boolean} - True si la destrucción fue exitosa
   */
  destroySession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      // Disparar hook cuando se intenta destruir una sesión inexistente
      this.hooks.doAction('session_destroy_failed', sessionId);
      return false;
    }

    const result = this.sessions.delete(sessionId);

    if (result) {
      // Disparar hook después de destruir la sesión
      this.hooks.doAction('session_destroyed', sessionId, session.data);
    }

    return result;
  }

  /**
   * Middleware de sesión
   * @returns {Function} - Middleware de sesión
   */
  middleware() {
    return (req, res, next) => {
      // Disparar hook antes de procesar la sesión
      this.hooks.doAction('session_middleware_before', req, res);

      // Obtener ID de sesión de la cookie
      const cookies = this.parseCookies(req.headers.cookie || '');
      const sessionId = cookies[this.cookieName];

      // Agregar métodos de sesión a la solicitud
      req.session = {
        id: sessionId,
        data: sessionId ? this.getSession(sessionId) : null,
        create: (userData) => {
          // Permitir que otros módulos modifiquen los datos antes de crear la sesión
          const processedUserData = this.hooks.applyFilters('session_create_user_data', userData, req);

          const newSessionId = this.createSession(processedUserData);
          req.session.id = newSessionId;
          req.session.data = processedUserData;

          // Establecer cookie con el ID de sesión
          res.setHeader('Set-Cookie', `${this.cookieName}=${newSessionId}; HttpOnly; Path=/; Max-Age=${this.timeout / 1000}`);

          // Disparar hook después de crear la sesión
          this.hooks.doAction('session_created_response', req, res, newSessionId);

          return newSessionId;
        },
        update: (newData) => {
          if (!req.session.id) return false;

          // Permitir que otros módulos modifiquen los datos antes de actualizar
          const processedNewData = this.hooks.applyFilters('session_update_user_data', newData, req, req.session.id);

          const result = this.updateSession(req.session.id, processedNewData);

          // Disparar hook después de actualizar la sesión
          if (result) {
            this.hooks.doAction('session_updated_response', req, res, req.session.id);
          }

          return result;
        },
        destroy: () => {
          if (!req.session.id) return false;

          // Disparar hook antes de destruir la sesión
          this.hooks.doAction('session_destroy_before', req, res, req.session.id);

          // Borrar cookie
          res.setHeader('Set-Cookie', `${this.cookieName}=; HttpOnly; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:01 GMT`);

          const result = this.destroySession(req.session.id);
          req.session.id = null;
          req.session.data = null;

          // Disparar hook después de destruir la sesión
          if (result) {
            this.hooks.doAction('session_destroyed_response', req, res);
          }

          return result;
        },
        regenerate: (userData) => {
          if (req.session.id) {
            this.destroySession(req.session.id);
          }
          return req.session.create(userData);
        }
      };

      // Disparar hook después de procesar la sesión
      this.hooks.doAction('session_middleware_after', req, res);

      // Continuar con el siguiente middleware
      if (next) {
        next();
      }
    };
  }

  /**
   * Parsea las cookies de la cabecera
   * @param {string} cookieHeader - Cabecera de cookies
   * @returns {Object} - Objeto con las cookies
   */
  parseCookies(cookieHeader) {
    const cookies = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const parts = cookie.trim().split('=');
        if (parts.length === 2) {
          cookies[parts[0]] = parts[1];
        }
      });
    }
    return cookies;
  }
}

/**
 * Middleware de autenticación basado en sesión
 * @param {SessionManager} sessionManager - Instancia del administrador de sesiones
 * @param {Object} options - Opciones de autenticación
 * @returns {Function} - Middleware de autenticación de sesión
 */
function sessionAuth(sessionManager, options = {}) {
  const redirectTo = options.redirectTo || '/login';
  const failureMessage = options.failureMessage || 'Acceso no autorizado. Por favor inicie sesión.';

  return (req, res, next) => {
    // Disparar hook antes de verificar la autenticación
    sessionManager.hooks.doAction('session_auth_check_before', req, res);

    // Verificar si hay una sesión activa
    if (!req.session || !req.session.data || !req.session.data.authenticated) {
      // Disparar hook cuando la autenticación falla
      sessionManager.hooks.doAction('session_auth_failed', req, res, redirectTo);

      // Si es una solicitud AJAX o API, devolver error JSON
      if (req.headers['x-requested-with'] === 'XMLHttpRequest' ||
          req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: failureMessage,
          redirect: redirectTo
        }));
        return;
      } else {
        // Para solicitudes normales, redirigir al login
        res.writeHead(302, { 'Location': redirectTo });
        res.end();
        return;
      }
    }

    // Disparar hook cuando la autenticación es exitosa
    sessionManager.hooks.doAction('session_auth_success', req, res);

    // Si hay sesión activa, continuar
    if (next) {
      next();
    }
  };
}

module.exports = { SessionManager, sessionAuth };