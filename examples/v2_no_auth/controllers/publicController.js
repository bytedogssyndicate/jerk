const publicController = {
  getPublicData: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Este es un endpoint público sin autenticación',
      timestamp: new Date().toISOString(),
      data: {
        randomValue: Math.floor(Math.random() * 100),
        serverStatus: 'operational',
        publicInfo: 'Esta información es accesible para todos'
      }
    }));
  }
};

module.exports = publicController;