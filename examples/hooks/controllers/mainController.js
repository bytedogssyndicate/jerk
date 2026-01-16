/**
 * Controlador principal (mainController)
 * Maneja la página de inicio
 */

const { ControllerBase } = require('jerkjs');

class MainController extends ControllerBase {
  constructor(options = {}) {
    super(options);
  }

  // Función para manejar la ruta de inicio
  home(req, res) {
    // Establecer variables para la vista
    this.set('title', 'Bienvenido a JERK Framework');
    this.set('message', 'Esta es una aplicación de ejemplo usando JERK Framework');

    // Renderizar la vista usando el motor de plantillas de JERK
    this.render(res, 'home', {
      endpoints: [
        { method: 'GET', path: '/users', description: 'Obtener todos los usuarios' },
        { method: 'GET', path: '/users/:id', description: 'Obtener usuario por ID' },
        { method: 'POST', path: '/users', description: 'Crear nuevo usuario' },
        { method: 'GET', path: '/products', description: 'Obtener todos los productos' },
        { method: 'GET', path: '/products/:id', description: 'Obtener producto por ID' },
        { method: 'POST', path: '/login', description: 'Iniciar sesión' }
      ]
    });
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