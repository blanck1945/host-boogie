#!/bin/sh
# generate_env_config.sh

# Crear el archivo env-config.js
echo "window._env_ = {" > /usr/share/nginx/html/env-config.js
echo "  VITE_YOUR_ID_LOGIN_URL: \"$VITE_YOUR_ID_LOGIN_URL\"," >> /usr/share/nginx/html/env-config.js
echo "  VITE_APPLICATION_MICROSERVICE_URL: \"$VITE_APPLICATION_MICROSERVICE_URL\"," >> /usr/share/nginx/html/env-config.js
echo "  VITE_ENV: \"$VITE_ENV\"" >> /usr/share/nginx/html/env-config.js
echo "};" >> /usr/share/nginx/html/env-config.js

# Ejecutar Nginx
exec "$@"