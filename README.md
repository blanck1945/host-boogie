# Host - Plataforma de Aplicaciones Descentralizadas

## 📋 Descripción

**Host** es una plataforma centralizada diseñada para alojar y gestionar aplicaciones descentralizadas de manera eficiente y segura. Actúa como un hub unificado que permite a los usuarios acceder, gestionar y navegar entre múltiples aplicaciones desde una única interfaz, eliminando la necesidad de recordar múltiples URLs y credenciales.

### Versión Actual
**v1.0.0**

---

## 🎯 ¿Qué es Host?

Host es una plataforma innovadora que simplifica el acceso a múltiples aplicaciones desde un único punto de entrada, proporcionando una experiencia de usuario fluida y unificada mediante tecnologías de vanguardia como **Module Federation** y arquitectura de microservicios.

### Características Principales

- ✅ **Acceso Unificado**: Todas tus aplicaciones en un solo lugar
- 🔐 **Autenticación Centralizada**: Sistema de autenticación robusto con YourID
- 📱 **Gestión de Aplicaciones**: Control total sobre visibilidad y acceso
- ⚡ **Carga Dinámica**: Tecnología Module Federation para carga instantánea
- 🏗️ **Arquitectura Escalable**: Diseñada para crecer con tus necesidades
- 🎨 **Interfaz Moderna**: UI/UX intuitiva con Tailwind CSS

---

## 🏗️ Arquitectura

### Tecnologías Utilizadas

#### Frontend
- **React 19.2.3**: Framework principal
- **TypeScript**: Tipado estático
- **Vite 7.2.4**: Build tool y dev server
- **Module Federation**: Carga dinámica de aplicaciones remotas
- **React Router 7.10.1**: Enrutamiento
- **TanStack Query 5.90.12**: Gestión de estado del servidor
- **Tailwind CSS 4.1.17**: Estilos y diseño

#### Backend e Infraestructura
- **AWS**: Cloud provider principal para microservicios
- **YourID**: Sistema de autenticación centralizada
- **Vercel**: Hosting del frontend

### Module Federation

Host utiliza **Module Federation** para cargar aplicaciones remotas de forma dinámica:

- **Ventajas**:
  - Carga bajo demanda de aplicaciones
  - Despliegue independiente de cada aplicación
  - Compartir dependencias comunes (React, React Router, etc.)
  - Mejor rendimiento y escalabilidad

- **Aplicaciones Remotas Configuradas**:
  - `remoteApp` (Atena): `https://remote-atena.vercel.app`
  - `remoteReactStreamlit` (Blizzard): `https://boogie-blizzard.vercel.app`
  - `remoteInformation` (Blizzard Admin): `https://blizzard-admin.vercel.app`

### Flujo de Arquitectura

```
Usuario
  │
  │ HTTPS
  │
  ▼
Frontend (Host - Vercel)
  │
  │ API Calls
  │
  ▼
Backend (AWS)
  │
  │ Module Federation
  │
  ▼
Aplicaciones Remotas
```

---

## 🚀 Funcionalidades

### 1. Gestión de Aplicaciones

- **Listado de Aplicaciones**: Vista de todas las aplicaciones disponibles
- **Ordenamiento**: Por ID, nombre o fecha de creación
- **Filtrado y Búsqueda**: Encuentra aplicaciones rápidamente
- **Estados de Aplicación**: Activo/Inactivo
- **Vista de Detalles**: Información completa de cada aplicación

### 2. Autenticación y Autorización

- **Login con YourID**: Autenticación centralizada
- **Refresh Tokens**: Renovación automática de sesiones
- **Control de Acceso**: Permisos granulares por aplicación
- **Gestión de Usuarios**: Roles y permisos
- **Estados de Autenticación**: Manejo de estados de carga y errores

### 3. Navegación y UX

- **Sidebar Colapsable**: Menú de aplicaciones con iniciales
- **Vista de Inicio**: Página de bienvenida con información
- **Navegación Fluida**: Transiciones suaves entre aplicaciones
- **Error Boundaries**: Manejo robusto de errores
- **Loading States**: Indicadores de carga

### 4. Carga de Aplicaciones

- **Module Federation**: Carga dinámica de aplicaciones remotas
- **Iframe Fallback**: Para aplicaciones no federadas
- **Error Handling**: Manejo robusto de errores
- **Suspense**: Estados de carga mientras se importan módulos

---

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ 
- pnpm (recomendado) o npm

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd host-boogie
```

2. **Instalar dependencias**
```bash
pnpm install
# o
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_APPLICATION_MICROSERVICE_URL=https://api.example.com
VITE_YOUR_ID_LOGIN_URL=https://auth.example.com
VITE_ENV=dev
```

4. **Ejecutar en desarrollo**
```bash
pnpm dev
# o
npm run dev
```

5. **Compilar para producción**
```bash
pnpm build
# o
npm run build
```

---

## 🛠️ Scripts Disponibles

- `pnpm dev`: Inicia el servidor de desarrollo
- `pnpm build`: Compila el proyecto para producción
- `pnpm preview`: Previsualiza el build de producción
- `pnpm lint`: Ejecuta el linter

---

## 📁 Estructura del Proyecto

```
host-boogie/
├── src/
│   ├── AppV2.tsx          # Componente principal de la aplicación
│   ├── main.tsx            # Punto de entrada
│   ├── config.ts           # Configuración de variables de entorno
│   ├── components/         # Componentes reutilizables
│   │   └── ApplicationCard.tsx
│   ├── sdk/                # SDK de YourID
│   │   ├── yourid-sdk.ts
│   │   └── useYourIDAuth.ts
│   └── types/              # Definiciones de tipos TypeScript
│       └── Application.ts
├── public/                 # Archivos estáticos
├── docs/                   # Documentación adicional
├── vite.config.ts          # Configuración de Vite y Module Federation
├── tsconfig.json           # Configuración de TypeScript
└── package.json            # Dependencias y scripts
```

---

## 🔧 Configuración

### Module Federation

Las aplicaciones remotas se configuran en `vite.config.ts`:

```typescript
federation({
  name: "host",
  remotes: {
    remoteApp: "https://remote-atena.vercel.app/assets/remoteEntry.js",
    remoteReactStreamlit: "https://boogie-blizzard.vercel.app/assets/remoteEntry.js",
    remoteInformation: "https://blizzard-admin.vercel.app/assets/remoteEntry.js",
  },
  shared: ["react", "react-dom", "react-router", "react-router-dom"],
})
```

### Mapeo de URLs

El mapeo de URLs a aplicaciones remotas se define en `AppV2.tsx`:

```typescript
const urlToRemoteMap = {
  "/atena": { remoteName: "remoteApp/App" },
  "/blizzard": { remoteName: "remoteReactStreamlit/routes" },
  "/blizzard-admin": { remoteName: "remoteInformation/App" },
};
```

---

## 🎨 Características de la UI

### Navbar
- Título "Host" con versión
- Información del usuario autenticado
- Diseño responsive

### Sidebar
- Lista de aplicaciones con iniciales
- Colapsable/Expandible
- Selector de ordenamiento
- Estados de carga y error

### Vista Principal
- Página de bienvenida con información
- Grid de aplicaciones disponibles
- Vista individual de aplicación
- Barra superior con navegación

---

## 🔐 Autenticación

Host utiliza el SDK de **YourID** para la autenticación:

- Autenticación centralizada
- Renovación automática de tokens
- Manejo de sesiones
- Control de acceso basado en roles

---

## 🚢 Despliegue

### Vercel (Recomendado)

El proyecto está configurado para desplegarse en Vercel:

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. El despliegue se realiza automáticamente en cada push

### Docker

También se puede desplegar usando Docker (ver `Dockerfile`):

```bash
docker build -t host-boogie .
docker run -p 3000:3000 host-boogie
```

---

## 📝 Casos de Uso

### Empresa con Múltiples Herramientas
Centralizar el acceso a herramientas internas (dashboard, analytics, CRM, etc.) con un solo login y dashboard unificado.

### Equipo de Desarrollo
Gestionar múltiples aplicaciones desde un dashboard centralizado, con despliegue independiente de cada aplicación.

### Organizaciones
Controlar el acceso a aplicaciones según departamento/rol, con gestión centralizada de permisos.

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.

---

## 📞 Soporte

Para soporte o preguntas, por favor abre un issue en el repositorio.

---

## 🗺️ Roadmap

- [ ] Mejoras en la gestión de aplicaciones
- [ ] Dashboard de analytics
- [ ] Notificaciones en tiempo real
- [ ] Soporte para más tipos de aplicaciones remotas
- [ ] Mejoras en la UI/UX

---

**Desarrollado con ❤️ usando React, TypeScript y Module Federation**
