#!/bin/bash

echo "Iniciando prueba de la API con autenticación SQLite..."

# Iniciar el servidor en segundo plano
node app.js &
SERVER_PID=$!

# Esperar a que el servidor inicie
sleep 3

echo "Probando endpoints..."

# Probar endpoint público
echo "1. Probando endpoint público (/)"
curl -s -w "\n%{http_code}\n" -X GET http://localhost:8088/

# Probar login
echo -e "\n2. Probando login..."
TOKEN=$(curl -s -X POST http://localhost:8088/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}' | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo "Login exitoso, token obtenido: ${TOKEN:0:20}..."
  
  # Probar endpoint protegido con token
  echo -e "\n3. Probando endpoint protegido (/protected) con token..."
  curl -s -w "\n%{http_code}\n" -X GET http://localhost:8088/protected \
    -H "Authorization: Bearer $TOKEN"
  
  # Probar endpoint de perfil con token
  echo -e "\n4. Probando endpoint de perfil (/profile) con token..."
  curl -s -w "\n%{http_code}\n" -X GET http://localhost:8088/profile \
    -H "Authorization: Bearer $TOKEN"
else
  echo "Error: No se pudo obtener el token de login"
fi

# Probar endpoint protegido sin token (debería fallar)
echo -e "\n5. Probando endpoint protegido (/protected) sin token (debería fallar)..."
curl -s -w "\n%{http_code}\n" -X GET http://localhost:8088/protected

echo -e "\nPrueba completada."

# Detener el servidor
kill $SERVER_PID