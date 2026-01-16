# Ejemplo API Pública sin Autenticación

Este ejemplo demuestra cómo crear una API pública sin autenticación utilizando el Framework JERK.

## Características

- API completamente pública sin requerir tokens o autenticación
- Rutas para diferentes tipos de datos
- Documentación OpenAPI generada automáticamente
- Endpoints de ejemplo para productos y datos públicos

## Configuración

No se requieren dependencias adicionales más allá del Framework JERK.

## Uso

1. Inicia el servidor:
   ```bash
   node app.js
   ```

2. El servidor escuchará en `http://localhost:8089`

## Endpoints

- `GET /` - Página de inicio
- `GET /public` - Datos públicos de ejemplo
- `GET /products` - Lista de productos
- `GET /products/:id` - Producto específico por ID
- `GET /health` - Estado del servicio
- `GET /docs` - Documentación interactiva de la API
- `GET /openapi.json` - Especificación OpenAPI

## Ejemplo de uso

1. Consultar productos:
   ```bash
   curl http://localhost:8089/products
   ```

2. Consultar producto específico:
   ```bash
   curl http://localhost:8089/products/1
   ```

3. Consultar datos públicos:
   ```bash
   curl http://localhost:8089/public
   ```

4. Ver estado del servicio:
   ```bash
   curl http://localhost:8089/health
   ```

## Estructura del proyecto

```
examples/v2_no_auth/
├── app.js              # Punto de entrada de la aplicación
├── routes.json         # Definición de rutas
├── controllers/        # Controladores de las rutas
│   ├── mainController.js
│   ├── publicController.js
│   ├── productController.js
│   └── healthController.js
└── README.md
```

## Notas

- Esta API no requiere autenticación, por lo que todos los endpoints son públicos
- Adecuada para servicios públicos, APIs de datos abiertos o prototipos
- La documentación OpenAPI se genera automáticamente y está disponible en `/docs`