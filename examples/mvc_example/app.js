/**
 * Ejemplo de uso del sistema MVC para el framework API SDK
 * Demostración de vistas y controladores MVC
 */

const { APIServer, Router, ControllerBase } = require('../../index');

// Crear un controlador personalizado que extienda ControllerBase
class HomeController extends ControllerBase {
  constructor(options = {}) {
    super(options);
  }

  // Acción para mostrar la página de inicio
  index(req, res) {
    // Establecer variables para la vista
    this.set('title', 'Página de Inicio');
    this.set('message', '¡Bienvenido al framework API SDK!');
    this.set('users', [
      { name: 'Juan', email: 'juan@example.com' },
      { name: 'María', email: 'maria@example.com' },
      { name: 'Pedro', email: 'pedro@example.com' }
    ]);
    
    // Renderizar la vista
    this.render(res, 'home/index', {
      currentTime: new Date().toISOString()
    });
  }

  // Acción para mostrar el perfil de un usuario
  profile(req, res) {
    // Obtener el ID del usuario de los parámetros
    const userIdParam = this.input('id', '1');

    // Validar que el ID sea un número entero positivo (no solo que empiece con un número)
    if (!/^\d+$/.test(userIdParam) || parseInt(userIdParam) <= 0) {
      // Si no es un ID válido, mostrar error
      this.set('title', 'ID de usuario inválido');
      this.render(res, 'user/invalid', {
        userId: userIdParam
      });
      return;
    }

    const userId = parseInt(userIdParam);

    // Array real de usuarios
    const users = [
      { id: 1, name: 'Ana García', email: 'ana@example.com', registered: '2026-01-01T10:00:00Z', active: true },
      { id: 2, name: 'Carlos López', email: 'carlos@example.com', registered: '2026-01-02T11:30:00Z', active: false },
      { id: 3, name: 'Laura Martínez', email: 'laura@example.com', registered: '2026-01-03T14:20:00Z', active: true },
      { id: 4, name: 'Pedro Rodríguez', email: 'pedro@example.com', registered: '2026-01-04T09:15:00Z', active: true },
      { id: 5, name: 'María Sánchez', email: 'maria@example.com', registered: '2026-01-05T16:45:00Z', active: false }
    ];

    // Buscar el usuario por ID
    const user = users.find(u => u.id === userId);

    if (!user) {
      // Si no se encuentra el usuario, mostrar error
      this.set('title', 'Usuario no encontrado');
      this.render(res, 'user/notfound', {
        userId: userId
      });
      return;
    }

    // Establecer variables para la vista
    this.set('title', `Perfil de ${user.name}`);
    this.set('user', user);

    // Renderizar la vista de perfil
    this.render(res, 'user/profile');
  }

  // Acción para mostrar la lista de usuarios
  users(req, res) {
    // Array real de usuarios (el mismo que en profile para consistencia)
    const users = [
      { id: 1, name: 'Ana García', email: 'ana@example.com', registered: '2026-01-01T10:00:00Z', active: true },
      { id: 2, name: 'Carlos López', email: 'carlos@example.com', registered: '2026-01-02T11:30:00Z', active: false },
      { id: 3, name: 'Laura Martínez', email: 'laura@example.com', registered: '2026-01-03T14:20:00Z', active: true },
      { id: 4, name: 'Pedro Rodríguez', email: 'pedro@example.com', registered: '2026-01-04T09:15:00Z', active: true },
      { id: 5, name: 'María Sánchez', email: 'maria@example.com', registered: '2026-01-05T16:45:00Z', active: false }
    ];

    // Establecer variables para la vista
    this.set('title', 'Lista de Usuarios');
    this.set('users', users);

    // Renderizar la vista de usuarios
    this.render(res, 'user/list');
  }
}

// Crear instancia del servidor
const server = new APIServer({
  port: 9000,
  host: 'localhost'
});

// Crear instancia del router
const router = new Router();

// Crear instancia del controlador
const homeController = new HomeController({ viewsPath: './examples/mvc_example/views' });

// Definir rutas
router
  .get('/', (req, res) => {
    // Establecer la solicitud y respuesta en el controlador
    homeController.setRequestResponse(req, res);
    homeController.index(req, res);
  })
  .get('/profile', (req, res) => {
    homeController.setRequestResponse(req, res);
    homeController.profile(req, res);
  })
  .get('/users', (req, res) => {
    homeController.setRequestResponse(req, res);
    homeController.users(req, res);
  });

// Agregar las rutas del router al servidor
const routes = router.getRoutes();
for (const route of routes) {
  server.addRoute(route.method, route.path, route.handler);
}

// Iniciar el servidor
server.start(() => {
  console.log('Servidor MVC iniciado en http://localhost:9000');
  console.log('Rutas disponibles:');
  console.log('- http://localhost:9000/ (Página de inicio)');
  console.log('- http://localhost:9000/profile?id=1 (Perfil de usuario)');
  console.log('- http://localhost:9000/users (Lista de usuarios)');
});