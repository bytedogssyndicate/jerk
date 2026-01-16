# Ejemplo API con Autenticación JSON

Este ejemplo demuestra cómo crear una API con autenticación basada en tokens estáticos almacenados en un archivo JSON utilizando el Framework JERK.

## Características

- Autenticación JWT con tokens gestionados a través de almacenamiento JSON
- Rutas protegidas y públicas
- Sistema de login para obtener tokens
- Controladores organizados por funcionalidad
- Tokens almacenados en un archivo JSON local

## Configuración

1. Asegúrate de tener instaladas las dependencias del framework JERK
2. El archivo de tokens `tokens.json` se creará automáticamente al iniciar la aplicación

## Uso

1. Inicia el servidor:
   ```bash
   node app.js
   ```

2. El servidor escuchará en `http://localhost:8091`

## Endpoints

- `GET /` - Página de inicio (público)
- `POST /login` - Iniciar sesión y obtener token (público)
- `GET /protected` - Contenido protegido (requiere token)
- `GET /profile` - Perfil de usuario (requiere token)
- `GET /tokens` - Ver tokens almacenados (requiere token)

## Ejemplo de uso

1. Iniciar sesión:
   ```bash
   curl -X POST http://localhost:8091/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "password"}'
   ```

2. Acceder a contenido protegido:
   ```bash
   curl -X GET http://localhost:8091/protected \
     -H "Authorization: Bearer TU_TOKEN_AQUI"
   ```

3. Ver perfil de usuario:
   ```bash
   curl -X GET http://localhost:8091/profile \
     -H "Authorization: Bearer TU_TOKEN_AQUI"
   ```

4. Ver tokens almacenados:
   ```bash
   curl -X GET http://localhost:8091/tokens \
     -H "Authorization: Bearer TU_TOKEN_AQUI"
   ```

## Estructura del proyecto

```
examples/v2_json_auth/
├── app.js              # Punto de entrada de la aplicación
├── routes.json         # Definición de rutas
├── controllers/        # Controladores de las rutas
│   ├── mainController.js
│   ├── authController.js
│   ├── protectedController.js
│   ├── userController.js
│   └── tokenController.js
├── tokens.json         # Archivo de almacenamiento de tokens (generado automáticamente)
└── README.md
```

## Seguridad

- Los tokens se gestionan a través del sistema de TokenManager del framework
- Los tokens expiran después de 1 hora
- Las rutas protegidas requieren un token válido en el header Authorization
- El archivo de tokens se almacena localmente en formato JSON