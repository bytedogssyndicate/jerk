const staticController = {
  getCSS: (req, res) => {
    const css = `
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

header {
    background-color: #333;
    color: white;
    padding: 1rem;
    border-radius: 5px;
}

header h1 {
    margin: 0;
}

nav ul {
    list-style-type: none;
    padding: 0;
    margin: 10px 0 0 0;
}

nav ul li {
    display: inline;
    margin-right: 20px;
}

nav ul li a {
    color: white;
    text-decoration: none;
    padding: 5px 10px;
    border-radius: 3px;
    transition: background-color 0.3s;
}

nav ul li a:hover {
    background-color: #555;
}

main {
    margin-top: 20px;
}

.hero {
    background-color: white;
    padding: 2rem;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.features {
    background-color: white;
    padding: 2rem;
    margin-top: 20px;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
}

button {
    background-color: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

button:hover {
    background-color: #0056b3;
}

footer {
    margin-top: 30px;
    text-align: center;
    padding: 20px;
    color: #666;
    border-top: 1px solid #ddd;
}`;

    res.writeHead(200);
    res.end(css);
  },

  getJS: (req, res) => {
    const js = `
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);

            // Enviar datos al servidor
            fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                const responseDiv = document.getElementById('response');

                if (result.success) {
                    responseDiv.innerHTML = '<p style="color: green;">' + result.message + '</p>';
                    contactForm.reset();
                } else {
                    responseDiv.innerHTML = '<p style="color: red;">Error: ' + result.message + '</p>';
                }

                // Ocultar mensaje después de 5 segundos
                setTimeout(() => {
                    responseDiv.innerHTML = '';
                }, 5000);
            })
            .catch(error => {
                console.error('Error:', error);
                const responseDiv = document.getElementById('response');
                responseDiv.innerHTML = '<p style="color: red;">Error de conexión</p>';
            });
        });
    }

    console.log('API Frontend Demo cargado correctamente');
});`;

    res.writeHead(200);
    res.end(js);
  }
};

module.exports = staticController;