// Simulación de base de datos en memoria
const users = [
  { id: 1, name: 'Juan Pérez', email: 'juan@example.com', age: 30 },
  { id: 2, name: 'María García', email: 'maria@example.com', age: 25 },
  { id: 3, name: 'Pedro Rodríguez', email: 'pedro@example.com', age: 35 }
];

const apiController = {
  getUsers: (req, res) => {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: users,
      count: users.length
    }));
  },

  getUserById: (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);

    if (!user) {
      res.writeHead(404);
      res.end(JSON.stringify({
        success: false,
        error: 'Usuario no encontrado'
      }));
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: user
    }));
  }
};

module.exports = apiController;