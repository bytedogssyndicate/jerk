/**
 * Controlador de ejemplo para usuarios
 * Archivo: examples/basic/controllers/userController.js
 */

// Simulación de base de datos
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

// Obtener todos los usuarios
function getUsers(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    data: users
  }));
}

// Obtener un usuario por ID
function getUserById(req, res) {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);

  if (!user) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      message: 'Usuario no encontrado'
    }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    data: user
  }));
}

// Crear un nuevo usuario
function createUser(req, res) {
  try {
    const { name, email } = req.body;

    // Validar datos
    if (!name || !email) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Nombre y correo electrónico son requeridos'
      }));
      return;
    }

    // Crear nuevo usuario
    const newUser = {
      id: users.length + 1,
      name,
      email
    };

    users.push(newUser);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: newUser
    }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      message: 'Error al crear usuario'
    }));
  }
}

// Exportar handlers
module.exports = {
  getUsers,
  getUserById,
  createUser
};