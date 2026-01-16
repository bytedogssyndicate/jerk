# API Pública de Ejemplo

Este ejemplo demuestra cómo crear una API pública usando el Framework JERK JS. La API incluye endpoints para gestionar usuarios y está protegida con CORS y rate limiting.

## Características

- API REST pública sin autenticación requerida
- Endpoints para gestión de usuarios (CRUD completo)
- Protección con CORS para permitir solicitudes desde cualquier origen
- Rate limiting para prevenir abusos
- Endpoints de salud del sistema
- Controladores organizados por funcionalidad

## Configuración

1. Asegúrate de tener instaladas las dependencias del framework JERK
2. No se requiere configuración adicional para esta API pública

## Uso

1. Inicia el servidor:
   ```bash
   node app.js
   ```

2. El servidor escuchará en `http://localhost:8081`

## Endpoints

- `GET /` - Información general de la API (público)
- `GET /users` - Lista todos los usuarios (público)
- `GET /users/:id` - Obtiene un usuario específico (público)
- `POST /users` - Crea un nuevo usuario (público)
- `PUT /users/:id` - Actualiza un usuario existente (público)
- `DELETE /users/:id` - Elimina un usuario (público)
- `GET /health` - Verifica el estado del servicio (público)

## Ejemplos de uso

1. Obtener todos los usuarios:
   ```bash
   curl -X GET http://localhost:8081/users
   ```

2. Obtener un usuario específico:
   ```bash
   curl -X GET http://localhost:8081/users/1
   ```

3. Crear un nuevo usuario:
   ```bash
   curl -X POST http://localhost:8081/users \
     -H "Content-Type: application/json" \
     -d '{"name": "Nuevo Usuario", "email": "nuevo@ejemplo.com", "age": 28}'
   ```

4. Actualizar un usuario:
   ```bash
   curl -X PUT http://localhost:8081/users/1 \
     -H "Content-Type: application/json" \
     -d '{"name": "Usuario Actualizado", "email": "actualizado@ejemplo.com"}'
   ```

5. Eliminar un usuario:
   ```bash
   curl -X DELETE http://localhost:8081/users/1
   ```

6. Verificar estado del servicio:
   ```bash
   curl -X GET http://localhost:8081/health
   ```

## Estructura del proyecto

```
examples/public/
├── app.js              # Punto de entrada de la aplicación
├── routes.json         # Definición de rutas
├── controllers/        # Controladores de las rutas
│   ├── mainController.js
│   ├── userController.js
│   └── healthController.js
└── README.md
```

## Seguridad

- CORS configurado para permitir solicitudes desde cualquier origen
- Rate limiting configurado para prevenir abusos (100 solicitudes por 15 minutos)
- No se requiere autenticación para acceder a los endpoints
- Validación de entrada en endpoints de creación/actualización