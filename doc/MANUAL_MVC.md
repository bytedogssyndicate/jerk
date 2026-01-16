# Manual del Sistema MVC para API SDK Framework

Visita nuestra página web: https://jerk.page.gd/
Repositorio oficial: https://gitlab.com/bytedogssyndicate1/jerk/

## Índice
1. [Introducción](#introducción)
2. [Arquitectura MVC](#arquitectura-mvc)
3. [Componentes del Sistema MVC](#componentes-del-sistema-mvc)
4. [Motor de Vistas (ViewEngine)](#motor-de-vistas-viewengine)
5. [Controladores Base (ControllerBase)](#controladores-base-controllerbase)
6. [Sintaxis de Plantillas](#sintaxis-de-plantillas)
7. [Hooks, Filters y Actions](#hooks-filters-y-actions)
8. [Ejemplos de Uso](#ejemplos-de-uso)
9. [Mejores Prácticas](#mejores-prácticas)

## Introducción

El sistema MVC (Modelo-Vista-Controlador) para el API SDK Framework proporciona una arquitectura organizada para desarrollar aplicaciones web. Este sistema permite separar la lógica de negocio, la presentación y el flujo de control de manera limpia y mantenible.

## Arquitectura MVC

La arquitectura MVC se divide en tres componentes principales:

- **Modelo**: Representa los datos y la lógica de negocio (manejado por el desarrollador)
- **Vista**: Presenta la información al usuario (manejado por el ViewEngine)
- **Controlador**: Coordina la interacción entre Modelo y Vista (manejado por ControllerBase)

## Componentes del Sistema MVC

### ViewEngine
Motor de vistas robusto que procesa plantillas con soporte para:
- Variables simples y anidadas
- Condiciones y bucles
- Filtros personalizables
- Hooks para extensibilidad
- Inclusiones de vistas

### ControllerBase
Clase base para controladores que proporciona:
- Métodos para pasar datos a vistas
- Renderizado de vistas
- Manejo de solicitudes y respuestas
- Acceso a parámetros de entrada

## Motor de Vistas (ViewEngine)

### Configuración
```javascript
const viewEngine = new ViewEngine({
  viewsPath: './views',           // Ruta a las vistas
  defaultExtension: '.html',      // Extensión por defecto
  cacheEnabled: true             // Habilitar cache
});
```

### Renderizado de Vistas
```javascript
// Renderizar una vista con datos
const html = viewEngine.render('home/index', {
  title: 'Mi Aplicación',
  users: [{name: 'Juan', email: 'juan@example.com'}]
});
```

## Controladores Base (ControllerBase)

### Extender ControllerBase
```javascript
const { ControllerBase } = require('@jerkjs');

class HomeController extends ControllerBase {
  constructor(options = {}) {
    super(options);
  }

  index(req, res) {
    this.set('title', 'Página de Inicio');
    this.set('message', '¡Bienvenido!');
    
    this.render(res, 'home/index', {
      currentTime: new Date()
    });
  }
}
```

### Métodos Disponibles
- `set(key, value)`: Establece variables para la vista
- `render(res, viewName, data)`: Renderiza y envía una vista como respuesta
- `view(viewName, data)`: Renderiza una vista y retorna el HTML
- `input(key, defaultValue)`: Obtiene valores de la solicitud
- `redirect(res, url)`: Redirecciona a otra URL
- `json(res, data)`: Envía una respuesta JSON

## Sintaxis de Plantillas

### Variables
```html
<h1>{{title}}</h1>
<p>{{user.name}}</p>
<p>{{user.profile.email}}</p>
```

### Condiciones
```html
{{if user.active}}
  <span class="active">Activo</span>
{{else}}
  <span class="inactive">Inactivo</span>
{{endif}}
```

### Bucles
```html
{{foreach:users}}
  <div>
    <h3>{{item.name}}</h3>
    <p>{{item.email}}</p>
  </div>
{{endforeach}}
```

### Inclusiones
```html
{{include:header}}
{{include:./partials/navigation}}
```

### Filtros
```html
<p>{{user.name|upper}}</p>
<p>{{user.bio|escape}}</p>
<p>{{post.date|date:'DD/MM/YYYY'}}</p>
```

## Hooks, Filters y Actions

### Filtros Disponibles
- `escape`: Escapa caracteres HTML
- `upper`: Convierte a mayúsculas
- `lower`: Convierte a minúsculas
- `capitalize`: Capitaliza texto
- `date`: Formatea fechas

### Agregar Filtros Personalizados
```javascript
viewEngine.addFilter('truncate', (value, length = 100) => {
  if (typeof value !== 'string') return value;
  return value.length > length ? value.substring(0, length) + '...' : value;
});
```

### Agregar Helpers Personalizados
```javascript
// Registrar un helper para formatear fechas
viewEngine.addHelper('formatDate', (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;

  const pad = (n) => n.toString().padStart(2, '0');
  const padYear = (n) => n.toString().padStart(4, '0');

  return format
    .replace('YYYY', padYear(d.getFullYear()))
    .replace('MM', pad(d.getMonth() + 1))
    .replace('DD', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()));
});

// Registrar un helper para verificar si un número es par
viewEngine.addHelper('isEven', (value) => {
  return Number(value) % 2 === 0;
});

// Registrar un helper para contar elementos
viewEngine.addHelper('count', (array) => {
  return Array.isArray(array) ? array.length : 0;
});
```

### Uso de Helpers en Plantillas
```html
<!-- Usar helper para formatear fecha -->
<p>Fecha de registro: {{formatDate(user.registered, 'DD/MM/YYYY')}}</p>

<!-- Usar helper para verificar si un número es par -->
{{if isEven(user.id)}}
  <span class="even-id">ID Par</span>
{{else}}
  <span class="odd-id">ID Impar</span>
{{endif}}

<!-- Usar helper para contar elementos -->
<p>Total de usuarios: {{count(users)}}</p>
```

### Validación de Sintaxis de Plantillas
```javascript
// Validar un template antes de renderizarlo
const template = `
  <h1>{{title}}</h1>
  {{if users}}
    {{foreach:users}}
      <div>{{item.name}}</div>
    {{endforeach}}
  {{endif}}
`;

const errors = ViewEngine.validateTemplate(template);
if (errors.length > 0) {
  console.warn('Errores de sintaxis encontrados:', errors);
}
```

### Opciones de Renderizado
```javascript
// Renderizar con opciones de validación y advertencias
const html = viewEngine.render('home/index', {
  title: 'Mi Aplicación',
  users: [{name: 'Juan', email: 'juan@example.com'}]
}, {
  validateSyntax: true,      // Validar sintaxis del template
  showWarnings: true,        // Mostrar advertencias sobre variables no definidas
  preserveUndefined: false   // Qué hacer con variables no definidas
});
```

## Ejemplos de Uso

### Ejemplo Completo de Controlador
```javascript
const { ControllerBase } = require('@jerkjs');

class UserController extends ControllerBase {
  constructor(options = {}) {
    super(options);
  }

  // Mostrar lista de usuarios
  index(req, res) {
    const users = [
      { id: 1, name: 'Ana', email: 'ana@example.com', active: true },
      { id: 2, name: 'Carlos', email: 'carlos@example.com', active: false }
    ];

    this.set('title', 'Lista de Usuarios');
    this.set('users', users);

    this.render(res, 'users/list');
  }

  // Mostrar perfil de usuario
  profile(req, res) {
    const userId = parseInt(this.input('id'));

    if (!userId || userId <= 0) {
      this.set('title', 'ID Inválido');
      this.render(res, 'users/invalid', { userId: this.input('id') });
      return;
    }

    const users = [
      { id: 1, name: 'Ana', email: 'ana@example.com', registered: '2026-01-01' },
      { id: 2, name: 'Carlos', email: 'carlos@example.com', registered: '2026-01-02' }
    ];

    const user = users.find(u => u.id === userId);

    if (!user) {
      this.set('title', 'Usuario No Encontrado');
      this.render(res, 'users/notfound', { userId });
      return;
    }

    this.set('title', `Perfil de ${user.name}`);
    this.set('user', user);

    this.render(res, 'users/profile');
  }
}
```

### Ejemplo de Uso de Helpers y Filtros
```javascript
class ProductController extends ControllerBase {
  constructor(options = {}) {
    super(options);

    // Registrar helpers personalizados para este controlador
    this.getViewEngine().addHelper('calculateDiscount', (price, discountPercent) => {
      return price - (price * discountPercent / 100);
    });

    this.getViewEngine().addFilter('currency', (value, symbol = '$') => {
      return `${symbol}${Number(value).toFixed(2)}`;
    });
  }

  products(req, res) {
    const products = [
      { id: 1, name: 'Producto A', price: 100, discount: 10 },
      { id: 2, name: 'Producto B', price: 200, discount: 15 }
    ];

    this.set('title', 'Catálogo de Productos');
    this.set('products', products);

    this.render(res, 'products/catalog');
  }
}
```

### Vista con Helpers y Filtros (products/catalog.html)
```html
<h1>{{title}}</h1>

{{if products}}
  <div class="product-grid">
    {{foreach:products}}
      <div class="product-card">
        <h3>{{item.name}}</h3>
        <p>Precio original: {{item.price|currency}}</p>
        <p>Descuento: {{item.discount}}%</p>
        <p>Precio con descuento: {{calculateDiscount(item.price, item.discount)|currency}}</p>
      </div>
    {{endforeach}}
  </div>
{{else}}
  <p>No hay productos disponibles.</p>
{{endif}}
```

### Vista de Lista de Usuarios (users/list.html)
```html
<h1>{{title}}</h1>

{{if users}}
<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Nombre</th>
      <th>Email</th>
      <th>Estado</th>
      <th>Acciones</th>
    </tr>
  </thead>
  <tbody>
    {{foreach:users}}
    <tr>
      <td>{{item.id}}</td>
      <td>{{item.name}}</td>
      <td>{{item.email}}</td>
      <td>
        {{if item.active}}
          <span class="active">Activo</span>
        {{else}}
          <span class="inactive">Inactivo</span>
        {{endif}}
      </td>
      <td><a href="/profile?id={{item.id}}">Ver Perfil</a></td>
    </tr>
    {{endforeach}}
  </tbody>
</table>
{{else}}
<p>No hay usuarios registrados.</p>
{{endif}}

<a href="/">Volver al inicio</a>
```

## Mejores Prácticas

1. **Organización de Archivos**:
   - Colocar vistas en `./views/nombre_modulo/nombre_vista.html`
   - Nombrar controladores con sufijo `Controller`
   - Usar convención de nombres en minúsculas con guiones bajos

2. **Seguridad**:
   - Siempre validar entradas de usuario
   - Usar el filtro `|escape` para mostrar datos de usuario
   - Validar IDs y parámetros antes de usarlos

3. **Rendimiento**:
   - Habilitar cache de vistas en producción
   - Minimizar la lógica en vistas
   - Usar datos eficientes en bucles

4. **Mantenibilidad**:
   - Separar lógica compleja en métodos del controlador
   - Usar vistas parciales para componentes repetitivos
   - Documentar controladores y vistas según sea necesario