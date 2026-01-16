const healthController = {
  getStatus: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'API Pública de Ejemplo',
      version: '1.0.0'
    }));
  }
};

module.exports = healthController;