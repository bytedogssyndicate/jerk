const { ControllerBase } = require('../../../index');

class WelcomeController extends ControllerBase {
  constructor(options = {}) {
    super(options);
  }

  index(req, res) {
    // Establecer variables para la vista
    this.set('title', 'Bienvenido a JERK Framework');
    this.set('message', 'El poderoso framework para construir aplicaciones web completas con Node.js');
    
    // Datos de características del framework
    this.set('features', [
      {
        name: 'Motor MVC',
        description: 'Sistema completo de vistas, controladores y modelos'
      },
      {
        name: 'Seguridad',
        description: 'Firewall integrado y protección contra ataques'
      },
      {
        name: 'Autenticación',
        description: 'Soporte para JWT, OAuth, sesiones y más'
      },
      {
        name: 'Flexibilidad',
        description: 'Arquitectura modular y altamente configurable'
      }
    ]);
    
    this.set('documentationUrl', 'https://jerk.page.gd/');
    this.set('examplesUrl', 'https://gitlab.com/bytedogssyndicate1/jerk');

    // Renderizar la vista
    this.render(res, 'home/welcome');
  }
}

module.exports = WelcomeController;