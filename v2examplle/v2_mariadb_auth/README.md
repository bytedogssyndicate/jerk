# Ejemplo API con Autenticación MariaDB

Este ejemplo demuestra cómo crear una API con autenticación basada en tokens almacenados en MariaDB utilizando el Framework JERK.

## Características

- Autenticación JWT con tokens almacenados en MariaDB
- Rutas protegidas y públicas
- Sistema de login/logout para obtener y revocar tokens
- Controladores organizados por funcionalidad
- Revocación de tokens en la base de datos

## Configuración

1. Asegúrate de tener instaladas las dependencias del framework JERK
2. Instala mariadb si aún no está instalado: `npm install mariadb`
3. Asegúrate de tener MariaDB instalado y en ejecución
4. Crea la base de datos `token_db` en MariaDB

## Preparación de la base de datos

Antes de ejecutar la aplicación, asegúrate de tener MariaDB en ejecución y crea la base de datos:

```sql
CREATE DATABASE IF NOT EXISTS token_db;
USE token_db;
```

La tabla de tokens se creará automáticamente al iniciar la aplicación.

## Uso

1. Inicia el servidor:
   ```bash
   node app.js
   ```

2. El servidor escuchará en `http://localhost:8090`

## Endpoints

- `GET /` - Página de inicio (público)
- `POST /login` - Iniciar sesión y obtener token (público)
- `GET /protected` - Contenido protegido (requiere token)
- `GET /profile` - Perfil de usuario (requiere token)
- `POST /logout` - Cerrar sesión y revocar token (requiere token)

## Ejemplo de uso

1. Iniciar sesión:
   ```bash
   curl -X POST http://localhost:8090/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "password"}'
   ```

2. Acceder a contenido protegido:
   ```bash
   curl -X GET http://localhost:8090/protected \
     -H "Authorization: Bearer TU_TOKEN_AQUI"
   ```

3. Ver perfil de usuario:
   ```bash
   curl -X GET http://localhost:8090/profile \
     -H "Authorization: Bearer TU_TOKEN_AQUI"
   ```

4. Cerrar sesión y revocar token:
   ```bash
   curl -X POST http://localhost:8090/logout \
     -H "Authorization: Bearer TU_TOKEN_AQUI"
   ```

## Estructura del proyecto

```
examples/v2_mariadb_auth/
├── app.js              # Punto de entrada de la aplicación
├── routes.json         # Definición de rutas
├── controllers/        # Controladores de las rutas
│   ├── mainController.js
│   ├── authController.js
│   ├── protectedController.js
│   └── userController.js
└── README.md
```

## Seguridad

- Los tokens se almacenan en una base de datos MariaDB
- Los tokens expiran después de 1 hora
- Las rutas protegidas requieren un token válido en el header Authorization
- Los tokens pueden ser revocados mediante el endpoint de logout