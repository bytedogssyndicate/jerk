# Ejemplo Frontend con API SDK JS

Este ejemplo demuestra cómo el Framework API SDK JS puede utilizarse para servir tanto APIs como contenido HTML para frontends, gracias a la nueva funcionalidad de especificación de content-type en el archivo routes.json.

## Características

- API REST y páginas HTML en el mismo servidor
- Especificación de content-type en routes.json
- Soporte para diferentes tipos de contenido (HTML, CSS, JavaScript, JSON)
- Frontend completamente funcional con estilos y scripts
- Navegación entre páginas HTML

## Configuración

1. Asegúrate de tener instaladas las dependencias del framework API SDK
2. No se requiere configuración adicional para este ejemplo

## Uso

1. Inicia el servidor:
   ```bash
   node app.js
   ```

2. El servidor escuchará en `http://localhost:8082`

## Endpoints

- `GET /` - Página de inicio HTML
- `GET /about` - Página Acerca de HTML
- `GET /contact` - Formulario de contacto HTML
- `GET /api/users` - API JSON de usuarios
- `GET /api/users/:id` - API JSON de usuario específico
- `GET /styles.css` - Archivo CSS
- `GET /script.js` - Archivo JavaScript

## Nueva funcionalidad: Content-Type en routes.json

Este ejemplo demuestra la nueva funcionalidad que permite especificar el content-type directamente en el archivo routes.json:

```json
{
  "path": "/",
  "method": "GET",
  "controller": "./controllers/pageController.js",
  "handler": "homePage",
  "auth": "none",
  "contentType": "text/html"
}
```

El campo `contentType` permite especificar el header Content-Type que se enviará con la respuesta, lo que permite servir diferentes tipos de contenido desde el mismo servidor.

## Estructura del proyecto

```
examples/frontend/
├── app.js              # Punto de entrada de la aplicación
├── routes.json         # Definición de rutas con content-type
├── controllers/        # Controladores de las rutas
│   ├── pageController.js   # Controladores para páginas HTML
│   ├── apiController.js    # Controladores para endpoints API
│   └── staticController.js # Controladores para recursos estáticos
└── README.md
```

## Seguridad

- CORS configurado para permitir solicitudes desde navegadores
- No se requiere autenticación para acceder a los endpoints
- El framework incluye protección WAF por defecto