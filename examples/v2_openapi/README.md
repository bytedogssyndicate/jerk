# Ejemplo API con Funcionalidad OpenAPI

Este ejemplo demuestra cómo crear una API con funcionalidad OpenAPI integrada utilizando el Framework JERK.

## Características

- API con autenticación JWT
- Documentación OpenAPI 3.0 generada automáticamente
- Interfaz Swagger UI para explorar y probar la API
- Rutas protegidas y públicas
- Controladores organizados por funcionalidad
- Esquemas OpenAPI definidos para modelos de datos

## Configuración

No se requieren dependencias adicionales más allá del Framework JERK.

## Uso

1. Inicia el servidor:
   ```bash
   node app.js
   ```

2. El servidor escuchará en `http://localhost:8092`

## Endpoints

- `GET /` - Página de inicio
- `POST /login` - Iniciar sesión y obtener token
- `GET /users` - Lista de usuarios (requiere token)
- `GET /products` - Lista de productos (requiere token)
- `GET /profile` - Perfil de usuario (requiere token)
- `GET /docs` - Documentación interactiva OpenAPI/Swagger
- `GET /openapi.json` - Especificación OpenAPI

## Ejemplo de uso

1. Iniciar sesión:
   ```bash
   curl -X POST http://localhost:8092/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "password"}'
   ```

2. Acceder a usuarios con el token:
   ```bash
   curl -X GET http://localhost:8092/users \
     -H "Authorization: Bearer TU_TOKEN_AQUI"
   ```

3. Ver documentación interactiva:
   Visita `http://localhost:8092/docs` en tu navegador

## Estructura del proyecto

```
examples/v2_openapi/
├── app.js              # Punto de entrada de la aplicación
├── routes.json         # Definición de rutas
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