# Etapa 1: Build
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el script de inyección
COPY generate_env_config.sh /docker-entrypoint.d/generate_env_config.sh
RUN chmod +x /docker-entrypoint.d/generate_env_config.sh

EXPOSE 80

# Usamos el entrypoint oficial de nginx que ejecuta los scripts en /docker-entrypoint.d/
CMD ["nginx", "-g", "daemon off;"]