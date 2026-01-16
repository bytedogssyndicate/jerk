/**
 * Ejemplo de uso del sistema MVC con definición de rutas desde archivo JSON
 * Demostración de vistas, helpers y filtros
 */

const { APIServer, RouteLoader, ControllerLoader, ViewEngine } = require('../../index');

// Crear instancia del servidor
const server = new APIServer({
  port: 9001,
  host: 'localhost'
});

// Crear instancia del cargador de rutas
const routeLoader = new RouteLoader();

// Cargar las rutas desde el archivo JSON
routeLoader.loadRoutes(server, './examples/mvc_routes_example/routes.json')
  .then(routes => {
    console.log(`${routes.length} rutas cargadas exitosamente`);
    console.log('Rutas disponibles:');
    console.log('- http://localhost:9001/ (Página de inicio)');
    console.log('- http://localhost:9001/users (Lista de usuarios)');
    console.log('- http://localhost:9001/profile?id=1 (Perfil de usuario)');
    console.log('- http://localhost:9001/products (Catálogo de productos)');
    
    // Iniciar el servidor
    server.start(() => {
      console.log('Servidor MVC con rutas JSON iniciado en http://localhost:9001');
    });
  })
  .catch(error => {
    console.error('Error al cargar las rutas:', error);
  });