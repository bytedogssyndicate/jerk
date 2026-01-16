const messageController = require('./messageController');

const authController = {
  // Mostrar formulario de login
  showLoginPage: (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - API Frontend Demo</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Área de Administración</h1>
            <nav>
                <ul>
                    <li><a href="/">Inicio</a></li>
                    <li><a href="/about">Acerca de</a></li>
                    <li><a href="/contact">Contacto</a></li>
                    <li><a href="/login">Login</a></li>
                    <li><a href="/api/users">Usuarios (API)</a></li>
                </ul>
            </nav>
        </header>
        
        <main>
            <section class="login-section">
                <h2>Iniciar Sesión</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="username">Usuario:</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="password">Contraseña:</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    
                    <button type="submit">Ingresar</button>
                </form>
                
                <div id="login-response"></div>
                
                <p><em>Usuario: admin | Contraseña: password123</em></p>
            </section>
        </main>
        
        <footer>
            <p>&copy; 2026 API SDK JS Framework</p>
        </footer>
    </div>
    <script src="/script.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const loginForm = document.getElementById('loginForm');
            
            if (loginForm) {
                loginForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const formData = new FormData(loginForm);
                    const data = Object.fromEntries(formData);
                    
                    fetch('/api/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    })
                    .then(response => response.json())
                    .then(result => {
                        const responseDiv = document.getElementById('login-response');
                        
                        if (result.success) {
                            responseDiv.innerHTML = '<p style="color: green;">Inicio de sesión exitoso. Redirigiendo...</p>';
                            
                            // Redirigir después de un breve delay
                            setTimeout(() => {
                                window.location.href = '/messages';
                            }, 1500);
                        } else {
                            responseDiv.innerHTML = '<p style="color: red;">' + result.message + '</p>';
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        const responseDiv = document.getElementById('login-response');
                        responseDiv.innerHTML = '<p style="color: red;">Error de conexión</p>';
                    });
                });
            }
        });
    </script>
</body>
</html>`;
    
    res.writeHead(200);
    res.end(html);
  },

  // Procesar login
  processLogin: async (req, res) => {
    try {
      // req.body puede ser un string o un objeto, dependiendo de cómo se haya procesado
      let body;
      if (typeof req.body === 'string') {
        body = JSON.parse(req.body);
      } else {
        body = req.body;
      }

      const { username, password } = body;

      // Validar credenciales
      const user = await messageController.validateUser(username, password);

      if (user) {
        // Crear sesión de usuario autenticado
        if (req.session) {
          req.session.create({
            authenticated: true,
            userId: user.id,
            username: user.username
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Inicio de sesión exitoso',
          userId: user.id
        }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Credenciales inválidas'
        }));
      }
    } catch (error) {
      console.error('Error en login:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Error interno del servidor'
      }));
    }
  },

  // Mostrar mensajes (requiere estar logueado - en este ejemplo simplificado no verificamos sesión)
  showMessages: async (req, res) => {
    try {
      // Obtener mensajes de la base de datos
      const messages = await messageController.getMessages();
      
      const messagesHtml = messages.length > 0 
        ? messages.map(msg => `
            <div class="message-item">
                <h4>${msg.name} (${msg.email})</h4>
                <p>${msg.message}</p>
                <small>Fecha: ${msg.created_at}</small>
            </div>
          `).join('')
        : '<p>No hay mensajes aún.</p>';

      const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mensajes - API Frontend Demo</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Mensajes Recibidos</h1>
            <nav>
                <ul>
                    <li><a href="/">Inicio</a></li>
                    <li><a href="/about">Acerca de</a></li>
                    <li><a href="/contact">Contacto</a></li>
                    <li><a href="/login">Login</a></li>
                    <li><a href="/api/users">Usuarios (API)</a></li>
                </ul>
            </nav>
        </header>
        
        <main>
            <section class="messages-section">
                ${messagesHtml}
            </section>
        </main>
        
        <footer>
            <p>&copy; 2026 API SDK JS Framework</p>
        </footer>
    </div>
    <script src="/script.js"></script>
</body>
</html>`;
    
      res.writeHead(200);
      res.end(html);
    } catch (error) {
      console.error('Error obteniendo mensajes:', error);
      res.writeHead(500);
      res.end('<h1>Error obteniendo mensajes</h1>');
    }
  }
};

module.exports = authController;