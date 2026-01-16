const messageController = require('./messageController');

const formController = {
  // Procesar el envío del formulario de contacto
  processContactForm: async (req, res) => {
    try {
      // req.body puede ser un string o un objeto, dependiendo de cómo se haya procesado
      let body;
      if (typeof req.body === 'string') {
        body = JSON.parse(req.body);
      } else {
        body = req.body;
      }

      const { name, email, message } = body;

      // Validar campos
      if (!name || !email || !message) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Todos los campos son obligatorios'
        }));
        return;
      }

      // Guardar el mensaje en la base de datos
      await messageController.saveMessage(name, email, message);

      // Responder con éxito
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Mensaje enviado exitosamente'
      }));
    } catch (error) {
      console.error('Error procesando formulario:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Error interno del servidor'
      }));
    }
  }
};

module.exports = formController;