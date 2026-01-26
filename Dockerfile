# Etapa 1: Build
FROM node:18-alpine AS build

# Habilitamos pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiamos archivos de dependencias
COPY pnpm-lock.yaml package.json ./

# Instalamos dependencias usando pnpm
RUN pnpm install --frozen-lockfile

# Copiamos el resto del código
COPY . .

# Generamos la carpeta /dist
RUN pnpm run build

# Etapa 2: Producción con Nginx
FROM nginx:stable-alpine

# Copiamos los archivos estáticos desde la etapa de build
COPY --from=build /app/dist /usr/share/nginx/html

# Copiamos tu configuración de nginx personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos el script de inyección de variables de entorno
# Este script se ejecutará automáticamente al iniciar el contenedor
COPY generate_env_config.sh /docker-entrypoint.d/generate_env_config.sh
RUN chmod +x /docker-entrypoint.d/generate_env_config.sh

EXPOSE 80

# Nginx corre en primer plano
CMD ["nginx", "-g", "daemon off;"]