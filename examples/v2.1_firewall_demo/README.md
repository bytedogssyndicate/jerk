# Ejemplo de API con Funcionalidades de Firewall Avanzado (v2.1.0)

Este ejemplo demuestra las funcionalidades de firewall avanzado implementadas en la versión 2.1.0 del Framework API SDK, incluyendo el sistema de hooks para eventos de seguridad.

## Características del Firewall

- **Detección de Patrones de Ataque**: Identificación de SQL Injection, XSS, Path Traversal
- **Bloqueo de IPs**: Sistema de bloqueo tras múltiples intentos fallidos
- **Listas Blancas y Negras**: IPs permitidas o prohibidas permanentemente
- **Reglas Personalizadas**: Posibilidad de definir reglas personalizadas de firewall
- **Sistema de Hooks**: Integración con el sistema de hooks para eventos de seguridad
- **Monitoreo de Solicitudes Sospechosas**: Registro y seguimiento de actividades sospechosas

## Configuración

No se requieren dependencias adicionales más allá del Framework API SDK.

## Uso

1. Inicia el servidor:
   ```bash
   node app.js
   ```

2. El servidor escuchará en `http://localhost:8097`

## Endpoints de Prueba

- `GET /` - Página de inicio con información del firewall
- `GET /test-attacks` - Prueba de detección de ataques
- `GET /test-sql-injection` - Prueba de detección de SQL injection (será bloqueada)
- `GET /test-xss` - Prueba de detección de XSS (será bloqueada)
- `GET /test-path-traversal` - Prueba de detección de path traversal (será bloqueada)
- `GET /firewall-status` - Estado actual del firewall

## Pruebas de Seguridad

### Prueba de SQL Injection
```bash
curl -X GET "http://localhost:8097/test-sql-injection?id=1'%20OR%20'1'='1"
```

### Prueba de XSS
```bash
curl -X GET "http://localhost:8097/test-xss?input=<script>alert('xss')</script>"
```

### Prueba de Path Traversal
```bash
curl -X GET "http://localhost:8097/test-path-traversal?file=../../../etc/passwd"
```

### Prueba de User Agent Sospechoso
```bash
curl -X GET http://localhost:8097/test-attacks -H "User-Agent: sqlmap/1.0"
```

## Sistema de Hooks de Seguridad

El ejemplo demuestra cómo usar el sistema de hooks para eventos de seguridad:

- `firewall_rule_triggered` - Se dispara cuando se activa una regla de firewall
- `firewall_ip_blocked` - Se dispara cuando se bloquea una IP
- `firewall_security_event` - Se dispara para eventos generales de seguridad

## Configuración del Firewall

El firewall se puede configurar con las siguientes opciones:

```javascript
const firewall = new Firewall({
  maxAttempts: 5,           // Número máximo de intentos antes de bloquear
  blockDuration: 900000,    // Duración del bloqueo en ms (15 minutos)
  whitelist: ['127.0.0.1'], // IPs que no deben ser bloqueadas
  blacklist: [],            // IPs que siempre deben ser bloqueadas
  rules: [                  // Reglas personalizadas de firewall
    {
      name: 'large_payload',
      condition: (req) => {
        // Condición para activar la regla
      },
      action: 'block',      // 'block' o 'monitor'
      reason: 'Motivo del bloqueo'
    }
  ],
  logger: logger            // Instancia de logger para eventos
});
```

## Estructura del proyecto

```
examples/v2.1_firewall_demo/
├── app.js              # Punto de entrada de la aplicación con firewall
├── controllers/        # Controladores de las rutas
│   └── (controladores según sea necesario)
└── README.md
```

## Reglas de Firewall Integradas

1. **SQL Injection Detection**: Detecta patrones comunes de inyección SQL
2. **XSS Detection**: Detecta patrones comunes de Cross-Site Scripting
3. **Path Traversal**: Detecta intentos de navegación fuera del directorio permitido
4. **Large Payload**: Bloquea solicitudes con cuerpos excesivamente grandes
5. **Suspicious User Agents**: Detecta user agents asociados con herramientas de ataque

## Seguridad

- El firewall bloquea automáticamente solicitudes que contienen patrones de ataque conocidos
- Las IPs que generan múltiples violaciones son bloqueadas temporalmente
- Las reglas personalizadas permiten una protección adaptada a necesidades específicas
- El sistema de hooks permite una respuesta personalizada a eventos de seguridad