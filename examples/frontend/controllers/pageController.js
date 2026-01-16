const messageController = require('./messageController');

const pageController = {
  homePage: (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inicio - API Frontend Demo</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Bienvenido a la API Frontend Demo</h1>
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
            <section class="hero">
                <h2>Framework JERK JS</h2>
                <p>Esta es una demostración de cómo el framework puede servir tanto APIs como contenido HTML para frontends.</p>
                <p>El content-type de esta página se establece desde el archivo routes.json.</p>
            </section>

            <section class="features">
                <h3>Características</h3>
                <ul>
                    <li>Soporte para múltiples content-types</li>
                    <li>Rutas parametrizadas</li>
                    <li>Middleware de seguridad</li>
                    <li>CORS configurado</li>
                </ul>
            </section>
        </main>

        <footer>
            <p>&copy; 2026 JERK JS Framework</p>
        </footer>
    </div>
    <script src="/script.js"></script>
</body>
</html>`;

    res.writeHead(200);
    res.end(html);
  },

  aboutPage: (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acerca de - API Frontend Demo</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Acerca de API Frontend Demo</h1>
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
            <section>
                <h2>Nuestro Framework</h2>
                <p>El Framework JERK JS es una solución completa para construir APIs seguras y escalables.</p>

                <h3>Capacidades Extendidas</h3>
                <p>Ahora también puede servir contenido HTML y otros tipos de contenido gracias a la nueva funcionalidad de especificación de content-type en routes.json.</p>

                <h3>Características Técnicas</h3>
                <ul>
                    <li>Arquitectura modular</li>
                    <li>Sistema de hooks y filtros</li>
                    <li>Seguridad avanzada (WAF)</li>
                    <li>Soporte para múltiples métodos de autenticación</li>
                    <li>Almacenamiento de tokens flexible</li>
                </ul>
            </section>
        </main>

        <footer>
            <p>&copy; 2026 JERK JS Framework</p>
        </footer>
    </div>
    <script src="/script.js"></script>
</body>
</html>`;

    res.writeHead(200);
    res.end(html);
  },

  contactPage: (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contacto - API Frontend Demo</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Formulario de Contacto</h1>
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
            <section>
                <form id="contactForm">
                    <div class="form-group">
                        <label for="name">Nombre:</label>
                        <input type="text" id="name" name="name" required>
                    </div>

                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" id="email" name="email" required>
                    </div>

                    <div class="form-group">
                        <label for="message">Mensaje:</label>
                        <textarea id="message" name="message" rows="5" required></textarea>
                    </div>

                    <button type="submit">Enviar</button>
                </form>

                <div id="response"></div>
            </section>
        </main>

        <footer>
            <p>&copy; 2026 JERK JS Framework</p>
        </footer>
    </div>
    <script src="/script.js"></script>
</body>
</html>`;

    res.writeHead(200);
    res.end(html);
  }
};

module.exports = pageController;