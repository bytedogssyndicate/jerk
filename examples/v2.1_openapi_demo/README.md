# Ejemplo API con Funcionalidades OpenAPI (v2.1.0)

Este ejemplo demuestra cómo crear una API con funcionalidades OpenAPI integradas utilizando el Framework API SDK.

## Características de OpenAPI

- **Generación automática de documentación OpenAPI 3.0**
- **Interfaz Swagger UI interactiva**
- **Definición de esquemas de datos**
- **Documentación de seguridad y autenticación**
- **Especificación de endpoints, parámetros y respuestas**
- **Soporte para diferentes formatos de contenido**
- **Validación de peticiones y respuestas**

## Configuración

No se requieren dependencias adicionales más allá del Framework API SDK.

## Uso

1. Inicia el servidor:
   ```bash
   node app.js
   ```

2. El servidor escuchará en `http://localhost:8096`

## Endpoints

- `GET /` - Página de inicio con información de OpenAPI
- `POST /login` - Iniciar sesión y obtener token
- `GET /users` - Lista de usuarios (requiere token)
- `GET /products` - Lista de productos (requiere token)
- `GET /docs` - Documentación interactiva OpenAPI/Swagger
- `GET /openapi.json` - Especificación OpenAPI

## Ejemplo de uso

1. Iniciar sesión:
   ```bash
   curl -X POST http://localhost:8096/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "password"}'
   ```

2. Acceder a usuarios con el token:
   ```bash
   curl -X GET http://localhost:8096/users \
     -H "Authorization: Bearer TU_TOKEN_AQUI"
   ```

3. Ver documentación interactiva:
   Visita `http://localhost:8096/docs` en tu navegador

4. Obtener especificación OpenAPI:
   ```bash
   curl -X GET http://localhost:8096/openapi.json
   ```

## Estructura del proyecto

```
examples/v2.1_openapi_demo/
├── app.js              # Punto de entrada de la aplicación
├── controllers/        # Controladores de las rutas
│   ├── mainController.js
│   ├── authController.js
│   ├── userController.js
│   └── productController.js
└── README.md
```

## Documentación OpenAPI

El framework genera automáticamente:

- Una especificación OpenAPI 3.0 en `/openapi.json`
- Una interfaz Swagger UI interactiva en `/docs`
- Esquemas de datos definidos para reutilización
- Documentación detallada de endpoints, parámetros y respuestas
- Soporte para diferentes códigos de respuesta HTTP
- Definición de esquemas de seguridad