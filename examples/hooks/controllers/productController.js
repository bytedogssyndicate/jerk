/**
 * Controlador de productos (productController)
 * Maneja operaciones CRUD de productos
 */

// Datos simulados de productos
let products = [
  { id: 1, name: 'Laptop', price: 1200, category: 'Electrónica' },
  { id: 2, name: 'Teléfono', price: 800, category: 'Electrónica' },
  { id: 3, name: 'Libro', price: 15, category: 'Educación' }
];

// Obtener todos los productos
function getAllProducts(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(products));
}

// Obtener un producto por ID
function getProductById(req, res) {
  // Obtener el ID de los parámetros de la ruta
  const urlParts = req.url.split('/');
  const productId = parseInt(urlParts[urlParts.length - 1]);
  
  const product = products.find(p => p.id === productId);
  
  if (product) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(product));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Producto no encontrado' }));
  }
}

module.exports = {
  getAllProducts,
  getProductById
};