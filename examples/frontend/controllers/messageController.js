const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class MessageController {
  constructor() {
    // Usar una base de datos SQLite en memoria para este ejemplo
    // En una aplicación real, usarías una ruta a un archivo
    this.db = new sqlite3.Database(':memory:');
    this.initDatabase();
  }

  initDatabase() {
    // Crear tabla de mensajes
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Crear tabla de usuarios para login
      this.db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insertar un usuario de ejemplo para pruebas
      this.db.run("INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)", ['admin', 'password123']);
    });
  }

  // Guardar un mensaje en la base de datos
  saveMessage(name, email, message) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare("INSERT INTO messages (name, email, message) VALUES (?, ?, ?)");
      stmt.run([name, email, message], function(err) {
        if (err) {
          console.error('Error guardando mensaje:', err);
          reject(err);
        } else {
          console.log(`Mensaje guardado con ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
      stmt.finalize();
    });
  }

  // Obtener todos los mensajes
  getMessages() {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM messages ORDER BY created_at DESC", [], (err, rows) => {
        if (err) {
          console.error('Error obteniendo mensajes:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Validar credenciales de usuario
  validateUser(username, password) {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) {
          console.error('Error validando usuario:', err);
          reject(err);
        } else if (row && row.password === password) {
          resolve(row);
        } else {
          resolve(null);
        }
      });
    });
  }

  // Cerrar la base de datos
  close() {
    this.db.close();
  }
}

// Instancia global para compartir la base de datos
const messageController = new MessageController();

module.exports = messageController;