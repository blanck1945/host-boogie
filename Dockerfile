# Etapa 1: Build de la aplicación
FROM node:18-alpine as build
WORKDIR /app

# Definimos los argumentos que recibiremos desde afuera
ARG VITE_YOUR_ID_LOGIN_URL
ARG VITE_APPLICATION_MICROSERVICE_URL
ARG VITE_ENV

# Los convertimos en variables de entorno para que el proceso de build los vea
ENV VITE_YOUR_ID_LOGIN_URL=$VITE_YOUR_ID_LOGIN_URL
ENV VITE_APPLICATION_MICROSERVICE_URL=$VITE_APPLICATION_MICROSERVICE_URL
ENV VITE_ENV=$VITE_ENV

COPY package*.json ./
RUN npm install
COPY . .

# Ahora este comando ya tendrá los valores reales inyectados
RUN npm run build

# Etapa 2: Servidor Nginx para producción
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]