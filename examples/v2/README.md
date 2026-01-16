# Ejemplo API con Autenticación SQLite

Este ejemplo demuestra cómo crear una API con autenticación basada en tokens almacenados en SQLite utilizando el Framework API SDK.

## Características

- Autenticación JWT con tokens almacenados en SQLite
- Rutas protegidas y públicas
- Sistema de login para obtener tokens
- Controladores organizados por funcionalidad

## Configuración

1. Asegúrate de tener instaladas las dependencias del framework API SDK
2. Instala sqlite3 si aún no está instalado: `npm install sqlite3`

## Uso

1. Inicia el servidor:
   ```bash
   node app.js
   ```

2. El servidor escuchará en `http://localhost:8088`

## Endpoints

- `GET /` - Página de inicio (público)
- `POST /login` - Iniciar sesión y obtener token (público)
- `GET /protected` - Contenido protegido (requiere token)
- `GET /profile` - Perfil de usuario (requiere token)

## Ejemplo de uso

1. Iniciar sesión:
   ```bash
   curl -X POST http://localhost:8088/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "password"}'
   ```

2. Acceder a contenido protegido:
   ```bash
   curl -X GET http://localhost:8088/protected \
     -H "Authorization: Bearer TU_TOKEN_AQUI"
   ```

3. Ver perfil de usuario:
   ```bash
   curl -X GET http://localhost:8088/profile \
     -H "Authorization: Bearer TU_TOKEN_AQUI"
   ```

## Estructura del proyecto

```
examples/v2/
├── app.js              # Punto de entrada de la aplicación
├── routes.json         # Definición de rutas
├── controllers/        # Controladores de las rutas
│   ├── mainController.js
│   ├── authController.js
│   ├── protectedController.js
│   └── userController.js
└── tokens_example.sqlite  # Base de datos SQLite para tokens (generada automáticamente)
```

## Seguridad

- Los tokens se almacenan en una base de datos SQLite
- Los tokens expiran después de 1 hora
- Las rutas protegidas requieren un token válido en el header Authorization