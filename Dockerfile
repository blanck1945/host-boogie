# Etapa 1: Build de la aplicación
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor Nginx para producción
FROM nginx:stable-alpine
# Copiamos el build al directorio de Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Copiamos una config de nginx para SPA (la que hablamos antes)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]