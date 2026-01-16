const protectedController = {
  getProtectedData: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Datos protegidos accesados exitosamente',
      user: req.user,
      timestamp: new Date().toISOString()
    }));
  }
};

module.exports = protectedController;