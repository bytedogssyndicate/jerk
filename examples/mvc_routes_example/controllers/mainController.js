const { ControllerBase } = require('../../../index');

class MainController extends ControllerBase {
  constructor(options = {}) {
    super(options);
  }

  index(req, res) {
    this.set('title', 'Inicio - Ejemplo MVC con Routes');
    this.set('message', '¡Bienvenido al ejemplo de MVC con definición de rutas!');

    this.render(res, 'main/index', {
      currentTime: new Date().toISOString(),
      version: '2.3.1'
    });
  }
}

// Exportar métodos directamente para que el RouteLoader pueda acceder a ellos
const controllerInstance = new MainController({ viewsPath: './examples/mvc_routes_example/views' });

module.exports = {
  index: (req, res) => {
    controllerInstance.setRequestResponse(req, res);
    controllerInstance.index(req, res);
  }
};