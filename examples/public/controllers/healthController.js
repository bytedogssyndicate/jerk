const healthController = {
  checkHealth: (req, res) => {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: 'API Pública de Ejemplo está operando correctamente',
      version: '1.0.0',
      endpoints: {
        total: 7,
        active: true
      }
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthStatus));
  }
};

module.exports = healthController;