/**
 * Controlador de usuarios (userController)
 * Maneja operaciones CRUD de usuarios
 */

// Datos simulados de usuarios
let users = [
  { id: 1, name: 'Juan Pérez', email: 'juan@example.com', age: 30 },
  { id: 2, name: 'María García', email: 'maria@example.com', age: 25 },
  { id: 3, name: 'Pedro Rodríguez', email: 'pedro@example.com', age: 35 }
];

// Obtener todos los usuarios
function getAllUsers(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(users));
}

// Obtener un usuario por ID
function getUserById(req, res) {
  // Obtener el ID de los parámetros de la ruta
  const urlParts = req.url.split('/');
  const userId = parseInt(urlParts[urlParts.length - 1]);
  
  const user = users.find(u => u.id === userId);
  
  if (user) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(user));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Usuario no encontrado' }));
  }
}

// Crear un nuevo usuario
function createUser(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const userData = JSON.parse(body);
      const newUser = {
        id: users.length + 1,
        name: userData.name,
        email: userData.email,
        age: userData.age
      };
      
      users.push(newUser);
      
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newUser));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Datos inválidos' }));
    }
  });
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser
};