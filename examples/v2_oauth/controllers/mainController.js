const mainController = {
  home: (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ejemplo OAuth con API SDK Framework</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .endpoint { margin: 10px 0; padding: 10px; background-color: #f0f0f0; border-radius: 5px; }
          a { color: #007bff; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>Ejemplo OAuth con API SDK Framework</h1>
        <p>Este ejemplo demuestra la funcionalidad OAuth 2.0 del framework.</p>
        
        <h2>Endpoints disponibles:</h2>
        <div class="endpoint">
          <strong><a href="/auth/google">GET /auth/google</a></strong> - Iniciar flujo OAuth con Google
        </div>
        <div class="endpoint">
          <strong><a href="/profile">GET /profile</a></strong> - Perfil de usuario (requiere token JWT)
        </div>
        <div class="endpoint">
          <strong><a href="/protected">GET /protected</a></strong> - Contenido protegido (requiere token JWT)
        </div>
        
        <h2>Instrucciones:</h2>
        <ol>
          <li>Visita <a href="/auth/google">/auth/google</a> para iniciar el flujo OAuth</li>
          <li>El callback OAuth manejará la autenticación y generará un token JWT</li>
          <li>Usa el token generado para acceder a los endpoints protegidos</li>
        </ol>
        
        <p><em>Nota: Este es un ejemplo funcional. En un entorno real, necesitarías configurar credenciales reales de OAuth con un proveedor como Google, GitHub, etc.</em></p>
      </body>
      </html>
    `);
  }
};

module.exports = mainController;