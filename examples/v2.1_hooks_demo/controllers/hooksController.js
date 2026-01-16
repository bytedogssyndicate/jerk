const jerk = require('../../../index.js');
const hooks = jerk.hooks;

const hooksController = {
  getHooksInfo: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Información sobre el sistema de hooks',
      hooksSystem: {
        'actionsRegistradas': hooks.actions ? hooks.actions.size : 0,
        'filtersRegistrados': hooks.filters ? hooks.filters.size : 0,
        'accionesDisponibles': [
          'framework_init',
          'pre_server_start',
          'post_server_start',
          'pre_route_load',
          'post_route_load',
          'pre_controller_load',
          'post_controller_load'
        ],
        'ejemploUso': 'hooks.addAction(nombreHook, funcionCallback)',
        'ejemploFiltro': 'hooks.addFilter(nombreFiltro, funcionCallback)'
      },
      timestamp: new Date().toISOString()
    }));
  }
};

module.exports = hooksController;