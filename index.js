/**
 * Punto de entrada del framework API SDK
 * API SDK Framework v2.0
 */

const APIServer = require('./lib/core/server');
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
const SQLiteTokenAdapter = require('./lib/utils/sqliteTokenAdapter');
const AuditLogger = require('./lib/middleware/auditLogger');
const OpenApiGenerator = require('./lib/utils/openapiGenerator');

const HookSystem = require('./lib/core/hooks');

// Importar componentes adicionales
const SecurityEnhancedServer = require('./lib/core/securityEnhancedServer');
const Firewall = require('./lib/middleware/firewall');
const { SessionManager, sessionAuth } = require('./lib/middleware/session');

// Componentes MVC
const ViewEngine = require('./lib/mvc/viewEngine');
const ControllerBase = require('./lib/mvc/controllerBase');

// Exportar todos los componentes del framework
module.exports = {
  // Componentes fundamentales (v1.0)
  APIServer,
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
  SQLiteTokenAdapter,
  AuditLogger,
  OpenApiGenerator,

  // Sistema de hooks para extensibilidad
  HookSystem,

  // Componentes de seguridad avanzada (v2.1.0)
  SecurityEnhancedServer,
  Firewall,

  // Componentes de sesión (v2.2.0)
  SessionManager,
  sessionAuth,

  // Componentes MVC (v2.3.0)
  ViewEngine,
  ControllerBase
};

// También exportar clases individuales por conveniencia
module.exports.APISDK = APIServer;

// Crear instancia global del sistema de hooks
module.exports.hooks = new HookSystem();

// Disparar hooks de inicio del framework
module.exports.hooks.doAction('framework_init');