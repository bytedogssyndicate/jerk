// Datos de ejemplo de usuarios
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
  { id: 3, name: 'Robert Johnson', email: 'robert@example.com', role: 'user' }
];

const userController = {
  getUsers: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users));
  },

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