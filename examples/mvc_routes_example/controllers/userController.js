const { ControllerBase } = require('../../../index');

class UserController extends ControllerBase {
  constructor(options = {}) {
    super(options);
  }

  list(req, res) {
    const users = [
      { id: 1, name: 'Ana García', email: 'ana@example.com', registered: '2026-01-01', active: true },
      { id: 2, name: 'Carlos López', email: 'carlos@example.com', registered: '2026-01-02', active: false },
      { id: 3, name: 'Laura Martínez', email: 'laura@example.com', registered: '2026-01-03', active: true },
      { id: 4, name: 'Pedro Rodríguez', email: 'pedro@example.com', registered: '2026-01-04', active: true },
      { id: 5, name: 'María Sánchez', email: 'maria@example.com', registered: '2026-01-05', active: false }
    ];

    this.set('title', 'Lista de Usuarios');
    this.set('users', users);

    this.render(res, 'user/list', {
      totalUsers: users.length
    });
  }

  profile(req, res) {
    const userIdParam = this.input('id', '1');

    // Validar que el ID sea un número entero positivo
    if (!/^\d+$/.test(userIdParam) || parseInt(userIdParam) <= 0) {
      this.set('title', 'ID de usuario inválido');
      this.render(res, 'user/invalid', {
        userId: userIdParam
      });
      return;
    }

    const userId = parseInt(userIdParam);

    const users = [
      { id: 1, name: 'Ana García', email: 'ana@example.com', registered: '2026-01-01', active: true },
      { id: 2, name: 'Carlos López', email: 'carlos@example.com', registered: '2026-01-02', active: false },
      { id: 3, name: 'Laura Martínez', email: 'laura@example.com', registered: '2026-01-03', active: true },
      { id: 4, name: 'Pedro Rodríguez', email: 'pedro@example.com', registered: '2026-01-04', active: true },
      { id: 5, name: 'María Sánchez', email: 'maria@example.com', registered: '2026-01-05', active: false }
    ];

    const user = users.find(u => u.id === userId);

    if (!user) {
      this.set('title', 'Usuario no encontrado');
      this.render(res, 'user/notfound', {
        userId: userId
      });
      return;
    }

    this.set('title', `Perfil de ${user.name}`);
    this.set('user', user);

    this.render(res, 'user/profile');
  }
}

// Exportar métodos directamente para que el RouteLoader pueda acceder a ellos
const controllerInstance = new UserController({ viewsPath: './examples/mvc_routes_example/views' });

module.exports = {
  list: (req, res) => {
    controllerInstance.setRequestResponse(req, res);
    controllerInstance.list(req, res);
  },
  profile: (req, res) => {
    controllerInstance.setRequestResponse(req, res);
    controllerInstance.profile(req, res);
  }
};