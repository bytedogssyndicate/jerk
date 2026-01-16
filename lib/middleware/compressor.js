/**
 * Middleware de compresión para el framework API SDK
 * Implementación del componente middleware/compressor.js
 */

const zlib = require('zlib');

class Compressor {
  /**
   * Constructor del compresor
   * @param {Object} options - Opciones de configuración
   * @param {Array} options.encodings - Tipos de compresión soportados
   * @param {number} options.threshold - Tamaño mínimo en bytes para comprimir
   * @param {Object} options.gzipOptions - Opciones para compresión gzip
   * @param {Object} options.deflateOptions - Opciones para compresión deflate
   */
  constructor(options = {}) {
    this.encodings = options.encodings || ['gzip', 'deflate'];
    this.threshold = options.threshold || 1024; // 1KB por defecto
    this.gzipOptions = options.gzipOptions || {};
    this.deflateOptions = options.deflateOptions || {};
  }

  /**
   * Middleware de compresión
   * @returns {Function} - Middleware de compresión
   */
  middleware() {
    return (req, res, next) => {
      // Verificar si el cliente acepta compresión
      const acceptEncoding = req.headers['accept-encoding'];
      if (!acceptEncoding) {
        if (next) next();
        return;
      }

      // Determinar el método de compresión preferido
      let compressionMethod = null;
      
      if (acceptEncoding.includes('gzip')) {
        compressionMethod = 'gzip';
      } else if (acceptEncoding.includes('deflate')) {
        compressionMethod = 'deflate';
      }

      // Si no se soporta ningún método, continuar sin comprimir
      if (!compressionMethod || !this.encodings.includes(compressionMethod)) {
        if (next) next();
        return;
      }

      // Guardar el método original de res.end
      const originalEnd = res.end;
      const originalWriteHead = res.writeHead;

      // Variable para almacenar el cuerpo de la respuesta
      let responseBody = '';
      
      // Sobrescribir res.write para capturar el cuerpo
      res.write = (chunk, encoding) => {
        responseBody += chunk;
      };

      // Sobrescribir res.end para comprimir antes de enviar
      res.end = (chunk, encoding) => {
        // Añadir el chunk final al cuerpo si existe
        if (chunk) {
          responseBody += chunk;
        }

        // Si el cuerpo es menor que el umbral, enviar sin comprimir
        if (Buffer.byteLength(responseBody) < this.threshold) {
          res.removeHeader('Content-Encoding'); // Asegurar que no haya encabezado de codificación
          originalWriteHead.call(res);
          originalEnd.call(res, responseBody, encoding);
          return;
        }

        // Aplicar compresión según el método seleccionado
        let compressedBody;
        let compressPromise;

        if (compressionMethod === 'gzip') {
          compressPromise = new Promise((resolve, reject) => {
            zlib.gzip(responseBody, this.gzipOptions, (err, buffer) => {
              if (err) {
                reject(err);
              } else {
                resolve(buffer);
              }
            });
          });
        } else if (compressionMethod === 'deflate') {
          compressPromise = new Promise((resolve, reject) => {
            zlib.deflate(responseBody, this.deflateOptions, (err, buffer) => {
              if (err) {
                reject(err);
              } else {
                resolve(buffer);
              }
            });
          });
        }

        // Esperar a que se complete la compresión y enviar la respuesta
        compressPromise
          .then(compressed => {
            // Establecer encabezados apropiados
            res.setHeader('Content-Encoding', compressionMethod);
            res.removeHeader('Content-Length'); // Eliminar Content-Length original
            
            // Llamar al writeHead original
            originalWriteHead.call(res);
            
            // Enviar el cuerpo comprimido
            originalEnd.call(res, compressed, encoding);
          })
          .catch(err => {
            console.error('Error comprimiendo la respuesta:', err);
            // Si ocurre un error, enviar sin comprimir
            res.removeHeader('Content-Encoding');
            originalWriteHead.call(res);
            originalEnd.call(res, responseBody, encoding);
          });
      };

      // Continuar con el siguiente middleware
      if (next) {
        next();
      }
    };
  }

  /**
   * Middleware para comprimir solo respuestas JSON
   * @returns {Function} - Middleware de compresión para JSON
   */
  jsonOnly() {
    return (req, res, next) => {
      const originalSend = res.send; // Suponiendo que hay un método send
      
      res.send = (data) => {
        // Verificar si el tipo de contenido es JSON
        const contentType = res.getHeader('Content-Type');
        if (contentType && contentType.includes('application/json')) {
          // Convertir a string si no lo es
          const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
          
          // Continuar con la lógica de compresión
          // (similar a la implementación en middleware())
          const acceptEncoding = req.headers['accept-encoding'];
          if (!acceptEncoding) {
            res.setHeader('Content-Type', 'application/json');
            originalSend.call(res, jsonString);
            return;
          }

          let compressionMethod = null;
          if (acceptEncoding.includes('gzip')) {
            compressionMethod = 'gzip';
          } else if (acceptEncoding.includes('deflate')) {
            compressionMethod = 'deflate';
          }

          if (!compressionMethod || !this.encodings.includes(compressionMethod)) {
            res.setHeader('Content-Type', 'application/json');
            originalSend.call(res, jsonString);
            return;
          }

          if (Buffer.byteLength(jsonString) < this.threshold) {
            res.setHeader('Content-Type', 'application/json');
            res.removeHeader('Content-Encoding');
            originalSend.call(res, jsonString);
            return;
          }

          if (compressionMethod === 'gzip') {
            zlib.gzip(jsonString, this.gzipOptions, (err, compressed) => {
              if (err) {
                console.error('Error comprimiendo JSON:', err);
                res.setHeader('Content-Type', 'application/json');
                originalSend.call(res, jsonString);
              } else {
                res.setHeader('Content-Encoding', compressionMethod);
                res.removeHeader('Content-Length');
                res.setHeader('Content-Type', 'application/json');
                originalSend.call(res, compressed);
              }
            });
          } else if (compressionMethod === 'deflate') {
            zlib.deflate(jsonString, this.deflateOptions, (err, compressed) => {
              if (err) {
                console.error('Error comprimiendo JSON:', err);
                res.setHeader('Content-Type', 'application/json');
                originalSend.call(res, jsonString);
              } else {
                res.setHeader('Content-Encoding', compressionMethod);
                res.removeHeader('Content-Length');
                res.setHeader('Content-Type', 'application/json');
                originalSend.call(res, compressed);
              }
            });
          }
        } else {
          // Si no es JSON, enviar normalmente
          originalSend.call(res, data);
        }
      };

      if (next) {
        next();
      }
    };
  }
}

module.exports = Compressor;