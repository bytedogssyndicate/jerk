const { ControllerBase } = require('../../../index');

class ProductController extends ControllerBase {
  constructor(options = {}) {
    super(options);

    // Registrar helpers personalizados para este controlador
    this.getViewEngine().addHelper('calculateDiscount', (price, discountPercent) => {
      return price - (price * discountPercent / 100);
    });

    this.getViewEngine().addHelper('formatCurrency', (value, symbol = '$') => {
      return `${symbol}${Number(value).toFixed(2)}`;
    });

    this.getViewEngine().addHelper('isOnSale', (product) => {
      return product.discount > 0;
    });
  }

  catalog(req, res) {
    const products = [
      { id: 1, name: 'Laptop Pro', price: 1200, discount: 10, category: 'Electronics' },
      { id: 2, name: 'Mouse Inalámbrico', price: 25, discount: 15, category: 'Accessories' },
      { id: 3, name: 'Teclado Mecánico', price: 80, discount: 0, category: 'Accessories' },
      { id: 4, name: 'Monitor 4K', price: 400, discount: 20, category: 'Electronics' },
      { id: 5, name: 'Auriculares', price: 150, discount: 5, category: 'Audio' }
    ];

    this.set('title', 'Catálogo de Productos');
    this.set('products', products);

    this.render(res, 'product/catalog', {
      currencySymbol: 'USD'
    });
  }
}

// Exportar métodos directamente para que el RouteLoader pueda acceder a ellos
const controllerInstance = new ProductController({ viewsPath: './examples/mvc_routes_example/views' });

module.exports = {
  catalog: (req, res) => {
    controllerInstance.setRequestResponse(req, res);
    controllerInstance.catalog(req, res);
  }
};