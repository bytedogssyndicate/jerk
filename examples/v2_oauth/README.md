# Ejemplo API con Funcionalidad OAuth 2.0

Este ejemplo demuestra cómo implementar autenticación OAuth 2.0 usando el Framework JERK.

## Características

- Implementación de flujo OAuth 2.0 (simulado para demostración)
- Generación de tokens JWT tras autenticación OAuth
- Rutas protegidas que requieren tokens JWT
- Simulación del proceso de autorización y callback
- Controladores organizados por funcionalidad

## Configuración

Este ejemplo simula el flujo OAuth para fines de demostración. En un entorno real, necesitarías:

1. Registrar tu aplicación con un proveedor OAuth (Google, GitHub, etc.)
2. Obtener Client ID y Client Secret
3. Configurar la URL de callback en tu aplicación
4. Ajustar las rutas y controladores según tus necesidades

## Uso

1. Inicia el servidor:
   ```bash
   node app.js
   ```

2. El servidor escuchará en `http://localhost:8093`

## Endpoints

- `GET /` - Página de inicio con instrucciones
- `GET /auth/google` - Iniciar flujo OAuth con Google (simulado)
- `GET /auth/callback` - Callback de OAuth (simulado)
- `GET /profile` - Perfil de usuario (requiere token JWT)
- `GET /protected` - Contenido protegido (requiere token JWT)

## Flujo de OAuth simulado

1. Visita `/auth/google` para iniciar el proceso OAuth
2. El sistema simulará la redirección a Google y el callback
3. Se generará un token JWT para el usuario autenticado
4. Usa el token para acceder a endpoints protegidos

## Estructura del proyecto

```
examples/v2_oauth/
├── app.js              # Punto de entrada de la aplicación
├── routes.json         # Definición de rutas
├── controllers/        # Controladores de las rutas
│   ├── mainController.js
│   ├── oauthController.js
│   ├── userController.js
│   └── protectedController.js
└── README.md
```

## Implementación real

Para implementar OAuth en un entorno real:

1. Registra tu aplicación con un proveedor OAuth
2. Configura las credenciales en el código
3. Implementa la lógica para intercambiar el código de autorización por tokens
4. Almacena de forma segura los tokens de acceso y refresh
5. Usa los tokens para acceder a las APIs del proveedor

El framework proporciona la estrategia `oauth2Strategy` que puedes usar con tus credenciales reales.