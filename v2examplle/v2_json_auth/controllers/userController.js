const userController = {
  getProfile: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      profile: {
        id: req.user.userId,
        username: req.user.username || 'Usuario',
        role: req.user.role || 'guest'
      },
      message: 'Perfil de usuario obtenido exitosamente'
    }));
  }
};

module.exports = userController;