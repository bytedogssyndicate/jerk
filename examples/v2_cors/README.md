# Ejemplo API con Funcionalidad CORS

Este ejemplo demuestra cómo usar la funcionalidad CORS (Cross-Origin Resource Sharing) del Framework JERK.

## Características

- Configuración de CORS con múltiples orígenes permitidos
- Configuración de métodos HTTP permitidos
- Configuración de encabezados permitidos y expuestos
- Soporte para credenciales
- Manejo de solicitudes preflight (OPTIONS)
- Ejemplos de endpoints para probar diferentes aspectos de CORS

## Configuración de CORS

El ejemplo configura CORS con las siguientes opciones:

- **Orígenes permitidos**: `['http://localhost:3000', 'http://localhost:8080', 'https://miapp.com']`
- **Métodos permitidos**: `['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']`
- **Encabezados permitidos**: `['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Api-Key']`
- **Encabezados expuestos**: `['X-Total-Count', 'X-Request-ID']`
- **Credenciales**: `true` (permite el uso de cookies y encabezados de autenticación)
- **Max Age**: `86400` (24 horas para caché de preflight)

## Uso

1. Inicia el servidor:
   ```bash
   node app.js
   ```

2. El servidor escuchará en `http://localhost:8094`

## Endpoints

- `GET /` - Página de inicio
- `GET /public` - Endpoint público con CORS habilitado
- `POST /data` - Endpoint para recibir datos con CORS
- `GET /test-cors` - Endpoint para probar diferentes encabezados CORS

## Pruebas de CORS

Puedes probar la funcionalidad CORS desde una aplicación web alojada en uno de los orígenes permitidos:

### Ejemplo de solicitud GET:
```javascript
fetch('http://localhost:8094/public')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Ejemplo de solicitud POST con encabezados personalizados:
```javascript
fetch('http://localhost:8094/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Key': 'tu-api-key'
  },
  body: JSON.stringify({ dato: 'ejemplo' })
})
.then(response => response.json())
.then(data => console.log(data));
```

### Solicitudes complejas que disparan preflight:
Las solicitudes con encabezados personalizados o ciertos tipos de contenido dispararán una solicitud OPTIONS preflight, que será manejada automáticamente por el middleware CORS.

## Estructura del proyecto

```
examples/v2_cors/
├── app.js              # Punto de entrada de la aplicación
└── README.md
```

## Notas

- El middleware CORS maneja automáticamente las solicitudes preflight (OPTIONS)
- Los encabezados expuestos son accesibles desde el código JavaScript del cliente
- Las credenciales permiten el uso de cookies y encabezados de autenticación
- El encabezado `Access-Control-Max-Age` permite cachear la respuesta preflight