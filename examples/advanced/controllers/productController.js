/**
 * Controlador de ejemplo para productos
 * Archivo: examples/advanced/controllers/productController.js
 */

// Simulación de base de datos de productos
let products = [
  { id: 1, name: 'Laptop', price: 1000, category: 'Electronics' },
  { id: 2, name: 'Mouse', price: 25, category: 'Accessories' }
];

// Obtener todos los productos
function getProducts(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    success: true,
    data: products
  }));
}

// Actualizar un producto por ID
function updateProduct(req, res) {
  try {
    const productId = parseInt(req.params.id);
    const { name, price, category } = req.body;

    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false,
        message: 'Producto no encontrado'
      }));
      return;
    }

    // Actualizar producto
    products[productIndex] = {
      ...products[productIndex],
      ...(name && { name }),
      ...(price && { price }),
      ...(category && { category })
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true,
      data: products[productIndex]
    }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false,
      message: 'Error al actualizar producto'
    }));
  }
}

// Exportar handlers
module.exports = {
  getProducts,
  updateProduct
};