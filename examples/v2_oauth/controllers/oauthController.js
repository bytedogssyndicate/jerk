const jwt = require('jsonwebtoken');
const { Authenticator, TokenManager } = require('../../../index.js');

// TokenManager para este controlador
const tokenManager = new TokenManager({
  storage: 'memory'
});

const oauthController = {
  initiateGoogleAuth: (req, res) => {
    // Obtener las credenciales de OAuth
    const clientId = process.env.OAUTH_CLIENT_ID;
    const clientSecret = process.env.OAUTH_CLIENT_SECRET;
    
    // Verificar si las credenciales están configuradas
    if (!clientId || clientId === 'tu-client-id-aqui' || !clientSecret || clientSecret === 'tu-client-secret-aqui') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Configurar OAuth con Google</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
            .container { max-width: 800px; margin: 0 auto; }
            .setup-instructions { 
              margin: 20px 0; 
              padding: 20px; 
              background-color: #fff3cd; 
              border: 1px solid #ffeaa7; 
              border-radius: 4px; 
              text-align: left;
            }
            .credentials-form {
              margin: 20px 0;
              padding: 20px;
              background-color: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 4px;
            }
            input[type="text"], input[type="password"] {
              width: 100%;
              padding: 8px;
              margin: 5px 0;
              box-sizing: border-box;
            }
            button {
              background-color: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              cursor: pointer;
              margin: 10px 5px;
            }
            button:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Configurar OAuth con Google</h1>
            
            <div class="setup-instructions">
              <h3>Para usar la autenticación OAuth real:</h3>
              <ol>
                <li>Registra tu aplicación en <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
                <li>Ve a "APIs & Services" > "Credentials"</li>
                <li>Crea un "OAuth 2.0 Client IDs"</li>
                <li>Configura "Authorized redirect URIs" con: <code>http://localhost:8093/auth/callback</code></li>
                <li>Copia tu Client ID y Client Secret</li>
              </ol>
            </div>
            
            <div class="credentials-form">
              <h3>Ingresa tus credenciales OAuth</h3>
              <form id="credentialsForm">
                <label for="clientId">Client ID:</label>
                <input type="text" id="clientId" name="clientId" placeholder="Ingresa tu Client ID">
                
                <label for="clientSecret">Client Secret:</label>
                <input type="password" id="clientSecret" name="clientSecret" placeholder="Ingresa tu Client Secret">
                
                <div style="margin-top: 15px;">
                  <button type="submit">Guardar Credenciales</button>
                  <button type="button" onclick="location.href='/'">Volver al inicio</button>
                </div>
              </form>
              
              <div id="statusMessage" style="margin-top: 15px; display: none;"></div>
            </div>
            
            <script>
              document.getElementById('credentialsForm').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const clientId = document.getElementById('clientId').value;
                const clientSecret = document.getElementById('clientSecret').value;
                
                // Enviar credenciales al servidor
                fetch('/auth/setup', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ clientId, clientSecret })
                })
                .then(response => response.json())
                .then(data => {
                  const statusDiv = document.getElementById('statusMessage');
                  statusDiv.style.display = 'block';
                  
                  if (data.success) {
                    statusDiv.innerHTML = '<p style="color: green;">Credenciales guardadas exitosamente. <a href="/auth/google">Haz clic aquí para iniciar OAuth</a></p>';
                    document.getElementById('credentialsForm').reset();
                  } else {
                    statusDiv.innerHTML = '<p style="color: red;">Error: ' + data.message + '</p>';
                  }
                })
                .catch(error => {
                  console.error('Error:', error);
                  document.getElementById('statusMessage').innerHTML = '<p style="color: red;">Error al guardar credenciales</p>';
                  document.getElementById('statusMessage').style.display = 'block';
                });
              });
            </script>
          </div>
        </body>
        </html>
      `);
      return;
    }
    
    // Si las credenciales están configuradas, crear la URL de autorización OAuth
    const redirectUri = encodeURIComponent('http://localhost:8093/auth/callback');
    const scope = encodeURIComponent('email profile');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    // Redirigir al usuario a la URL de autorización de Google
    res.writeHead(302, { 'Location': authUrl });
    res.end();
  },

  handleCallback: async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No authorization code received' }));
      return;
    }
    
    try {
      // En una implementación real, intercambiaríamos el código por tokens de acceso
      const clientId = process.env.OAUTH_CLIENT_ID;
      const clientSecret = process.env.OAUTH_CLIENT_SECRET;
      const redirectUri = 'http://localhost:8093/auth/callback';
      
      // Simular la obtención de tokens (en una implementación real, haríamos una solicitud HTTP real)
      // Aquí es donde el framework realmente haría el trabajo pesado
      
      // Simular la obtención de información del usuario desde Google
      // En una implementación real, usaríamos el access token para llamar a la API de Google
      const userInfo = {
        id: 'demo_user_id',
        email: 'demo@example.com',
        name: 'Demo User',
        picture: 'https://via.placeholder.com/150'
      };
      
      // Generar un token JWT para el usuario autenticado
      const secret = 'super-secret-key-for-oauth-example';
      const tokenPayload = {
        userId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        provider: 'google',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // Expira en 1 hora
      };
      
      const token = jwt.sign(tokenPayload, secret);
      
      // Enviar respuesta con el token
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <h2>¡Autenticación OAuth exitosa!</h2>
        <p>Usuario autenticado: <strong>${userInfo.name}</strong></p>
        <p>Email: <strong>${userInfo.email}</strong></p>
        <p>Proveedor: <strong>Google</strong></p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px;">
          <p><strong>Token JWT generado:</strong></p>
          <textarea readonly style="width: 100%; height: 80px; font-family: monospace;">${token}</textarea>
          <p>Este token puede usarse en el header <code>Authorization: Bearer &lt;token&gt;</code> para acceder a endpoints protegidos</p>
        </div>
        
        <p><a href="/profile">Ir al perfil del usuario</a> | <a href="/">Volver a la página principal</a></p>
      `);
    } catch (error) {
      console.error('Error en el callback OAuth:', error);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`
        <h2>Error en el proceso de autenticación</h2>
        <p>${error.message}</p>
        <p><a href="/auth/google">Intentar de nuevo</a></p>
      `);
    }
  },
  
  setupCredentials: (req, res) => {
    // Este endpoint es para fines de demostración
    // En una implementación real, las credenciales se configurarían en variables de entorno
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // En una implementación real, esto se haría de forma segura
        // Aquí solo simulamos el proceso para fines de demostración
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'Credenciales recibidas. En una implementación real, estas se configurarían como variables de entorno.' 
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          message: 'Error al procesar las credenciales' 
        }));
      }
    });
  }
};

module.exports = oauthController;