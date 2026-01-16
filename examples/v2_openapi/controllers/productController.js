// Datos de ejemplo de productos
const products = [
  { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics' },
  { id: 2, name: 'Mouse', price: 29.99, category: 'Electronics' },
  { id: 3, name: 'Keyboard', price: 79.99, category: 'Electronics' },
  { id: 4, name: 'Monitor', price: 299.99, category: 'Electronics' },
  { id: 5, name: 'Webcam', price: 89.99, category: 'Electronics' }
];

const productController = {
  getProducts: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(products));
  }
};

module.exports = productController;