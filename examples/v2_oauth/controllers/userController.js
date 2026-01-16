const userController = {
  getProfile: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      profile: {
        id: req.user.userId,
        email: req.user.email,
        name: req.user.name,
        provider: req.user.provider,
        authenticatedAt: new Date().toISOString()
      },
      message: 'Perfil de usuario obtenido exitosamente'
    }));
  }
};

module.exports = userController;