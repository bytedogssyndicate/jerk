const { TokenManager } = require('../../../index.js');

// TokenManager para este controlador
const tokenManager = new TokenManager({
  storage: 'json',
  tokenFile: './tokens.json'
});

const tokenController = {
  getTokens: (req, res) => {
    try {
      // Obtener todos los tokens almacenados
      const tokens = tokenManager.getAllTokens ? tokenManager.getAllTokens() : 'Método no disponible en esta implementación';
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Tokens almacenados',
        tokens: tokens || 'No se pudo obtener la lista de tokens'
      }));
    } catch (error) {
      console.error('Error obteniendo tokens:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error obteniendo tokens' }));
    }
  }
};

module.exports = tokenController;