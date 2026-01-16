# Documentación de Aprendizajes con JERKJS

## 1. Formato del archivo routes.json

**Formato correcto:**
```json
[
  {
    "method": "GET",
    "path": "/",
    "controller": "./controllers/mainController.js",
    "handler": "home",
    "auth": "none"
  }
]
```

**Características importantes:**
- Debe ser un array directo de rutas, **NO** un objeto con propiedad "routes"
- Campos requeridos: `method`, `path`, `controller`, `handler`, `auth`
- El campo `controller` debe especificar la ruta completa al archivo del controlador
- El campo `handler` debe especificar el nombre exacto del método en el controlador
- El campo `auth` puede ser "none", "required", etc.

## 2. Estructura de controladores para usar con routes.json

**Formato correcto:**
```javascript
const { ControllerBase } = require('jerkjs');

class MainController extends ControllerBase {
  constructor(options = {}) {
    super(options);
  }

  home(req, res) {
    // Lógica del controlador
  }
}

// Exportar métodos directamente para que el RouteLoader pueda acceder a ellos
const controllerInstance = new MainController({ viewsPath: './views' });

module.exports = {
  home: (req, res) => {
    controllerInstance.setRequestResponse(req, res);
    controllerInstance.home(req, res);
  }
};
```

**Características importantes:**
- No se puede exportar directamente la instancia del controlador
- Debe exportar un objeto con funciones que encapsulan la llamada al método del controlador
- Se debe llamar a `setRequestResponse()` antes de ejecutar el método del controlador

## 3. Uso del motor de plantillas de JERK

**Características del motor de plantillas:**
- Usa sintaxis `{{variable}}` para mostrar variables
- Soporta condicionales: `{{if variable}}contenido{{endif}}`
- Soporta bucles: `{{foreach:array}}contenido{{endforeach}}`
- Se accede a los elementos del bucle con `{{item.property}}`

## 4. Sistema de hooks

**Tipos de hooks:**
- `addAction(nombre_hook, callback)` - Para acciones que se ejecutan en puntos específicos
- `addFilter(nombre_hook, callback)` - Para filtrar/modificar datos

**Hooks útiles:**
- `post_controller_load` - Se ejecuta después de cargar un controlador
- `pre_route_load` - Se ejecuta antes de cargar rutas
- `post_route_load` - Se ejecuta después de cargar rutas
- `request_received` - Se ejecuta cuando se recibe una solicitud
- `request_completed` - Se ejecuta cuando se completa una solicitud

## 5. Puerto y configuración del servidor

**Configuración del servidor:**
```javascript
const server = new APIServer({
  port: 11000,  // Puerto específico
  host: 'localhost'
});
```

## 6. Controladores que extienden ControllerBase

**Características:**
- Deben extender `ControllerBase` del framework
- Usan `this.set()` para establecer variables de vista
- Usan `this.render()` para renderizar vistas
- Requieren que se llame a `setRequestResponse()` antes de usar métodos del controlador

## 7. Errores comunes y soluciones

**Error común:** "this.set is not a function"
**Solución:** Asegurarse de que se llama a `controllerInstance.setRequestResponse(req, res)` antes de ejecutar métodos del controlador

**Error común:** "Error cargando rutas desde ./routes.json: El archivo de rutas debe contener un array de rutas"
**Solución:** Asegurarse de que routes.json sea un array directo, no un objeto con propiedad "routes"

**Error común:** "controllerLoader.loadControllers is not a function"
**Solución:** El RouteLoader se encarga de cargar tanto rutas como controladores, no usar ControllerLoader por separado

## 8. Recursos útiles

- Directorio de ejemplos en `/node_modules/jerkjs/examples/`
- Archivos routes.json de ejemplo en los directorios de ejemplos
- Documentación en el README del paquete

Esta documentación servirá para futuros desarrollos con JERKJS y evitará caer en los mismos errores o confusiones.