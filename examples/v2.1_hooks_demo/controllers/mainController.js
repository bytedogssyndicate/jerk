const mainController = {
  home: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'API con sistema de hooks activo',
      features: [
        'Pre/Post hooks para carga de rutas',
        'Pre/Post hooks para carga de controladores',
        'Pre/Post hooks para inicio de servidor',
        'Filtros para modificar datos de respuesta',
        'Extensibilidad en múltiples puntos del ciclo de vida'
      ],
      timestamp: new Date().toISOString()
    }));
  }
};

module.exports = mainController;