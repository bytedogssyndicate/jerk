# Ejemplo de Sistema de Hooks en Framework API SDK

Este ejemplo demuestra cómo usar el sistema de hooks como el core de WordPress para extender la funcionalidad del Framework API SDK en diferentes puntos del ciclo de vida.

## Características del Sistema de Hooks

- **Acciones (Actions)**: Puntos de extensión donde se pueden ejecutar funciones
- **Filtros (Filters)**: Puntos donde se pueden modificar datos antes de ser procesados
- **Extensibilidad**: Capacidad para agregar funcionalidades en múltiples puntos del ciclo de vida
- **Ciclo de Vida**: Hooks disponibles en diferentes etapas del proceso

## Hooks Disponibles

### Hooks de Servidor
- `framework_init`: Se ejecuta cuando se inicializa el framework
- `pre_server_start`: Antes de iniciar el servidor
- `post_server_start`: Después de iniciar el servidor

### Hooks de Carga de Rutas
- `pre_route_load`: Antes de cargar rutas desde archivo
- `post_route_load`: Después de cargar rutas desde archivo

### Hooks de Carga de Controladores
- `pre_controller_load`: Antes de cargar un controlador
- `post_controller_load`: Después de cargar un controlador

## Configuración

No se requieren dependencias adicionales más allá del Framework API SDK.

## Uso

1. Inicia el servidor:
   ```bash
   node app.js
   ```

2. El servidor escuchará en `http://localhost:8096`

## Endpoints

- `GET /` - Página de inicio con información del sistema de hooks
- `GET /hooks-info` - Información sobre el sistema de hooks

## Ejemplo de uso de Hooks

```javascript
const { hooks } = require('jerk');

// Registrar una acción
hooks.addAction('nombre_del_hook', (param1, param2) => {
  console.log('Hook ejecutado con:', param1, param2);
});

// Registrar un filtro
hooks.addFilter('nombre_del_filtro', (valor, parametroAdicional) => {
  return valor + parametroAdicional;
});

// Ejecutar una acción
hooks.doAction('nombre_del_hook', 'dato1', 'dato2');

// Aplicar un filtro
const resultado = hooks.applyFilters('nombre_del_filtro', 'valorInicial', 'datoAdicional');
```

## Estructura del proyecto

```
examples/v2.1_hooks_demo/
├── app.js              # Punto de entrada de la aplicación con hooks
├── routes.json         # Definición de rutas
├── controllers/        # Controladores de las rutas
│   ├── mainController.js
│   └── hooksController.js
└── README.md
```

## Beneficios del Sistema de Hooks

1. **Extensibilidad**: Permite extender la funcionalidad sin modificar el código base
2. **Modularidad**: Módulos pueden añadir funcionalidades sin interferir entre sí
3. **Flexibilidad**: Hooks disponibles en múltiples puntos del ciclo de vida
4. **Personalización**: Capacidad para modificar comportamientos predeterminados
5. **Integración**: Fácil integración con sistemas de terceros