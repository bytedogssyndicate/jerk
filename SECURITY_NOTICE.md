# AVISO DE SEGURIDAD — IMPORTANTE

Este repositorio incluye ejemplos y código de demostración pensados únicamente para fines educativos y de desarrollo. NO utilices claves, secretos, contraseñas o credenciales reales en estos ejemplos ni las comitees al repositorio.

Si vas a ejecutar los ejemplos o desplegar código derivado, sigue estas recomendaciones:

- Usa variables de entorno para secretos (p. ej. `process.env.JWT_SECRET`, `process.env.DB_PASSWORD`).
- No hardcodees secretos en el código. Añade un archivo `.env` local y ponlo en `.gitignore`.
- Añade un archivo `.env.example` sin valores reales para documentar las variables necesarias.
- Rota las claves y secretos si sospechás que han sido expuestos.
- Para bases de datos de ejemplo (SQLite, MariaDB, etc.) usa credenciales temporales en entornos de desarrollo.
- No uses secretos de producción en datasets de desarrollo o en demos públicas.

Recursos rápidos:
- Archivo de ejemplo de variables: `.env.example`
- Ignorar variables locales: `.gitignore` (debe incluir `.env`)
- Herramientas para detectar secretos antes de push: `git-secrets`, `truffleHog`, `detect-secrets`.

Si querés, puedo:
- Añadir un `.env.example` en los ejemplos que lo requieran,
- Modificar los ejemplos que contienen secretos hardcodeados para leer de `process.env`,
- Añadir un job de CI que escanee por secretos.

Este aviso fue agregado automáticamente para reducir el riesgo de exposición accidental de secretos.
