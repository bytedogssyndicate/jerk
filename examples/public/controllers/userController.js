// Simulación de base de datos en memoria
let users = [
  { id: 1, name: 'Juan Pérez', email: 'juan@example.com', age: 30 },
  { id: 2, name: 'María García', email: 'maria@example.com', age: 25 },
  { id: 3, name: 'Pedro Rodríguez', email: 'pedro@example.com', age: 35 }
];

let nextId = 4;

const userController = {
  getAllUsers: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
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
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Usuario no encontrado'
      }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: user
    }));
  },

  createUser: (req, res) => {
    try {
      const { name, email, age } = req.body;

      // Validación simple
      if (!name || !email) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Nombre y correo electrónico son obligatorios'
        }));
        return;
      }

      // Crear nuevo usuario
      const newUser = {
        id: nextId++,
        name,
        email,
        age: age || null
      };

      users.push(newUser);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: newUser,
        message: 'Usuario creado exitosamente'
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Error interno del servidor'
      }));
    }
  },

  updateUser: (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { name, email, age } = req.body;

      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Usuario no encontrado'
        }));
        return;
      }

      // Actualizar usuario
      if (name) users[userIndex].name = name;
      if (email) users[userIndex].email = email;
      if (age !== undefined) users[userIndex].age = age;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: users[userIndex],
        message: 'Usuario actualizado exitosamente'
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Error interno del servidor'
      }));
    }
  },

  deleteUser: (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Usuario no encontrado'
      }));
      return;
    }

    const deletedUser = users.splice(userIndex, 1)[0];

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: deletedUser,
      message: 'Usuario eliminado exitosamente'
    }));
  }
};

module.exports = userController;