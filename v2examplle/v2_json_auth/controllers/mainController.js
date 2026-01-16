const mainController = {
  home: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Bienvenido a la API de ejemplo con autenticación JSON',
      endpoints: {
        'POST /login': 'Iniciar sesión y obtener token',
        'GET /protected': 'Contenido protegido (requiere token)',
        'GET /profile': 'Perfil de usuario (requiere token)',
        'GET /tokens': 'Ver tokens almacenados (requiere token)'
      }
    }));
  }
};

module.exports = mainController;