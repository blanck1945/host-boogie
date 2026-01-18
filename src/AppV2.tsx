import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  useState,
  Suspense,
  lazy,
  Component,
  type ReactNode,
  useEffect,
} from "react";

// Importar los componentes remotos lazy (enfoque simple como AppV3)
// @ts-expect-error RemoteApp is not defined
const RemoteAppLazy = lazy(() => import("remoteApp/App"));
// @ts-expect-error RemoteReactStreamlit is not defined
const RemoteReactStreamlitLazy = lazy(() => import("remoteReactStreamlit/routes"));
// @ts-expect-error RemoteInformation is not defined
const RemoteInformationAppLazy = lazy(() => import("remoteInformation/App"));
import {
  useNavigate,
  useLocation,
} from "react-router-dom";
import type { Application } from "./types/Application";
import { ApplicationCard } from "./components/ApplicationCard";
import { useYourIdAuth } from "./sdk/useYourIDAuth";
import { getAuthHeaders } from "./sdk/yourid-sdk";

// Error Boundary para manejar errores en componentes remotos
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("Error rendering remote component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-slate-50">
          <div className="text-center">
            <p className="text-slate-600 text-lg mb-2">
              Error al cargar la aplicación
            </p>
            <p className="text-slate-500 text-sm">
              {this.state.error?.message || "Error desconocido"}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


// Mapeo de URLs de aplicación a nombres de remotes de Module Federation
// Este mapeo se basa en los remotes configurados en vite.config.ts
const urlToRemoteMap: Record<string, { remoteName: string; exportName?: string }> = {
  "/atena": { remoteName: "remoteApp/App" },
  "/blizzard": { remoteName: "remoteReactStreamlit/routes" },
  "/blizzard-admin": { remoteName: "remoteInformation/App" },
  // Agregar más mapeos aquí según sea necesario
};

// Función para determinar si una URL es un remote de Module Federation
function isModuleFederationRemote(url: string): boolean {
  // Verificar si la URL está en el mapeo
  if (urlToRemoteMap[url]) {
    return true;
  }
  
  // Verificar si la URL comienza con alguno de los paths mapeados
  return Object.keys(urlToRemoteMap).some(mappedUrl => url.startsWith(mappedUrl));
}

// Función para obtener el remote name desde la URL
function getRemoteNameFromUrl(url: string): { remoteName: string; exportName?: string } | null {
  // Buscar coincidencia exacta primero
  if (urlToRemoteMap[url]) {
    return urlToRemoteMap[url];
  }
  
  // Buscar coincidencia por prefijo
  for (const [mappedUrl, config] of Object.entries(urlToRemoteMap)) {
    if (url.startsWith(mappedUrl)) {
      return config;
    }
  }
  
  return null;
}



// Función para extraer iniciales del nombre de la aplicación
function getAppInitials(appName: string): string {
  const words = appName
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) return "";

  if (words.length === 1) {
    // Una palabra: primera letra
    return words[0].charAt(0).toUpperCase();
  } else if (words.length === 2) {
    // Dos palabras: primera letra de cada palabra
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  } else {
    // Más de dos palabras: primera letra de las primeras dos palabras
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
}

// Declarar el tipo para la variable global
declare global {
  interface Window {
    __MF_BASENAME__?: string;
    __MF_HOST__?: boolean;
  }
}

// Componente wrapper para establecer basename antes de renderizar (similar a AppV3)
function RemoteAppWrapper({ children, appUrl }: { children: ReactNode; appUrl: string }) {
  const location = useLocation();
  
  // Establecer basename SÍNCRONAMENTE antes de renderizar (crítico para que funcione)
  if (typeof window !== 'undefined') {
    window.__MF_BASENAME__ = appUrl;
    window.__MF_HOST__ = true;
    console.log('[RemoteAppWrapper] Basename establecido SÍNCRONAMENTE:', appUrl, 'para ruta:', location.pathname);
  }
  
  // También mantenerlo actualizado con useEffect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__MF_BASENAME__ = appUrl;
      window.__MF_HOST__ = true;
      console.log('[RemoteAppWrapper] Basename actualizado en useEffect:', appUrl);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.__MF_BASENAME__;
        delete window.__MF_HOST__;
      }
    };
  }, [appUrl, location.pathname]);

  return <>{children}</>;
}

// Componente wrapper para renderizar remotes de MF
function RemoteAppRenderer({ app }: { app: Application }) {
  const appUrl = app.url || "";
  
  // Establecer basename SÍNCRONAMENTE antes de cualquier otra cosa
  // Esto es crítico porque el componente lazy se importa cuando se renderiza
  if (typeof window !== 'undefined') {
    window.__MF_BASENAME__ = appUrl;
    window.__MF_HOST__ = true;
    console.log('[RemoteAppRenderer] Basename establecido SÍNCRONAMENTE:', appUrl);
  }
  
  // Verificar si es un remote de Module Federation
  const isRemote = isModuleFederationRemote(appUrl);
  
  // Obtener la configuración del remote desde la URL
  const remoteConfig = getRemoteNameFromUrl(appUrl);
  
  // Si no es un remote de MF, mostrar en iframe
  if (!isRemote || !remoteConfig) {
    return (
      <iframe
        src={appUrl}
        className="w-full h-full border-0"
        title={app.appName || "Aplicación"}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
      />
    );
  }
  
  // Renderizar el componente remoto correcto según el remoteName
  const renderRemoteComponent = () => {
    // Asegurar que el basename esté establecido antes de renderizar
    if (typeof window !== 'undefined') {
      window.__MF_BASENAME__ = appUrl;
      window.__MF_HOST__ = true;
    }
    
    switch (remoteConfig.remoteName) {
      case "remoteApp/App":
        return <RemoteAppLazy />;
      case "remoteReactStreamlit/routes":
        return <RemoteReactStreamlitLazy />;
      case "remoteInformation/App":
        return <RemoteInformationAppLazy />;
      default:
        return null;
    }
  };
  
  return (
    <RemoteAppWrapper appUrl={appUrl}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full bg-slate-50">
            <div className="text-center">
              <p className="text-slate-600 text-lg">
                Cargando aplicación...
              </p>
            </div>
          </div>
        }
      >
        <div className="w-full h-full overflow-auto">
          <ErrorBoundary>
            {renderRemoteComponent()}
          </ErrorBoundary>
        </div>
      </Suspense>
    </RemoteAppWrapper>
  );
}

// Componente para mostrar una aplicación individual
function AppViewer({ 
  app, 
  onBack 
}: { 
  app: Application;
  onBack?: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Barra superior con información de la app */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              onBack?.();
              navigate("/v2", { replace: true });
            }}
            className="text-slate-600 hover:text-slate-800 flex items-center gap-2 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver
          </button>
          <div className="h-6 w-px bg-slate-300" />
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {app.appName}
              {app.description && (
                <>
                  {" | "}
                  <span className="font-normal text-slate-600">
                    {app.description}
                  </span>
                </>
              )}
            </h2>
          </div>
        </div>
        <span
          className={`
            px-3
            py-1
            rounded-full
            text-xs
            font-semibold
            ${
              app.isActive
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"
            }
          `}
        >
          {app.isActive ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* Contenedor para la aplicación */}
      <div className="flex-1 relative">
        {app.isActive ? (
          <RemoteAppRenderer app={app} />
        ) : (
          <div className="flex items-center justify-center h-full bg-slate-50">
            <div className="text-center">
              <p className="text-slate-600 text-lg mb-2">
                Esta aplicación está inactiva
              </p>
              <p className="text-slate-500 text-sm">
                No se puede mostrar en este momento
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para la vista de inicio (lista de aplicaciones)
function HomeView({ 
  applications, 
  onAppSelect 
}: { 
  applications: Application[];
  onAppSelect?: (app: Application) => void;
}) {
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'createdAt'>('id');

  return (
    <div className="p-6 overflow-y-auto h-full">
      {/* Página de bienvenida por defecto */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-800 mb-4">
            Bienvenido a{" "}
            <span className="text-slate-700">Host</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Tu plataforma centralizada para aplicaciones
            descentralizadas
          </p>
        </div>

        {/* Pitch de ventas */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-xl p-8 mb-8 border border-slate-200">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">
                ¿Qué es Host?
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Host es una plataforma innovadora diseñada para
                alojar y gestionar aplicaciones descentralizadas de
                manera eficiente y segura. Simplificamos el acceso a
                múltiples aplicaciones desde un único punto de
                entrada, proporcionando una experiencia de usuario
                fluida y unificada.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Seguro y Confiable
                </h3>
                <p className="text-slate-600 text-sm">
                  Autenticación robusta y gestión centralizada de
                  aplicaciones con máxima seguridad.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Acceso Unificado
                </h3>
                <p className="text-slate-600 text-sm">
                  Todas tus aplicaciones en un solo lugar. Navega
                  entre ellas sin complicaciones.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Rápido y Eficiente
                </h3>
                <p className="text-slate-600 text-sm">
                  Carga instantánea de aplicaciones con tecnología
                  de Module Federation.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                ¿Cómo funciona?
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-600">
                <li>
                  <strong className="text-slate-800">
                    Explora
                  </strong>{" "}
                  las aplicaciones disponibles en el menú lateral
                </li>
                <li>
                  <strong className="text-slate-800">
                    Selecciona
                  </strong>{" "}
                  la aplicación que deseas usar
                </li>
                <li>
                  <strong className="text-slate-800">
                    Disfruta
                  </strong>{" "}
                  de una experiencia fluida e integrada
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Lista de aplicaciones */}
        {applications && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                Aplicaciones Disponibles
                {applications.length > 0 && (
                  <span className="ml-2 text-lg font-normal text-slate-500">
                    ({applications.length})
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="sort-select-main"
                  className="text-sm font-medium text-slate-700 whitespace-nowrap"
                >
                  Ordenar por:
                </label>
                <select
                  id="sort-select-main"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as 'id' | 'name' | 'createdAt'
                    )
                  }
                  className="
                    px-4
                    py-2
                    bg-white
                    text-slate-800
                    border
                    border-slate-300
                    rounded-lg
                    text-sm
                    font-medium
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    focus:border-blue-500
                    hover:border-slate-400
                    transition-colors
                    shadow-sm
                    min-w-[180px]
                  "
                >
                  <option value="id">ID (por defecto)</option>
                  <option value="name">Nombre</option>
                  <option value="createdAt">Fecha de creación</option>
                </select>
              </div>
            </div>
            {applications.length > 0 ? (
              <ul
                className="
                  grid 
                  grid-cols-1
                  md:grid-cols-2
                  lg:grid-cols-3
                  gap-6
                "
              >
                {applications.map((app: Application) => (
                  <li key={app.id}>
                    <ApplicationCard
                      application={app}
                      onClick={() => onAppSelect?.(app)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600 text-lg">
                  No hay aplicaciones disponibles
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AppV2() {
  // 1) Usamos el SDK
  const { user, isChecking, authError } = useYourIdAuth({
    applicationBaseUrl: import.meta.env.VITE_APPLICATION_MICROSERVICE_URL,
    yourIdLoginUrl: import.meta.env.VITE_YOUR_ID_LOGIN_URL,
    env: import.meta.env.VITE_ENV, // "dev" | "prod"
  });

  // Estados
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'createdAt'>('id');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // 2) Cargar aplicaciones SOLO cuando el usuario está autenticado
  const { data, isLoading, error } = useQuery({
    queryKey: ["applications", sortBy],
    enabled: !!user && !authError,
    queryFn: async () => {
      const url = `${import.meta.env.VITE_APPLICATION_MICROSERVICE_URL}/applications`;
      console.log('Fetching applications with sortBy:', sortBy, 'from:', url);
      const res = await axios.get(url, {
        headers: getAuthHeaders(),
        params: {
          sortBy: sortBy,
        },
      });
      console.log('Applications received:', res.data?.length || 0, 'apps');
      return res.data as Application[];
    },
  });

  // Sincronizar selectedApp con la ruta actual
  useEffect(() => {
    if (!data) return;

    const currentPath = location.pathname;
    
    // Si estamos en /v2, mostrar home
    if (currentPath === '/v2' || currentPath === '/v2/') {
      // Usar setTimeout para evitar setState síncrono en effect
      setTimeout(() => setSelectedApp(null), 0);
      return;
    }

    // Buscar aplicación por ID en la ruta /v2/app/:id (fallback para compatibilidad)
    const pathParts = currentPath.split('/');
    const appIdIndex = pathParts.indexOf('app');
    if (appIdIndex !== -1 && appIdIndex < pathParts.length - 1 && currentPath.startsWith('/v2/app/')) {
      const appIdStr = pathParts[appIdIndex + 1];
      // Intentar buscar por ID numérico o string
      const app = data.find(a => String(a.id) === appIdStr || a.id === parseInt(appIdStr));
      if (app && app.id !== selectedApp?.id) {
        setTimeout(() => setSelectedApp(app), 0);
      }
      return;
    }

    // Buscar aplicación por URL (para rutas como /blizzard, /atena, /blizzard-admin, etc.)
    // Normalizar la ruta para comparar (remover trailing slash y wildcards)
    const normalizedPath = currentPath.replace(/\/$/, '').split('/*')[0];
    
    // Buscar aplicación que coincida con la URL
    // Primero buscar coincidencia exacta
    let app = data.find(a => {
      const appUrl = a.url || '';
      return appUrl === normalizedPath || appUrl === currentPath;
    });

    // Si no hay coincidencia exacta, buscar por prefijo (para rutas anidadas como /atena/stats)
    if (!app) {
      app = data.find(a => {
        const appUrl = a.url || '';
        // Verificar si la ruta actual comienza con la URL de la app (para rutas anidadas)
        // o si la URL de la app está en el mapeo de remotes
        const pathMatches = currentPath.startsWith(appUrl + '/') || currentPath === appUrl;
        const normalizedMatches = normalizedPath.startsWith(appUrl + '/') || normalizedPath === appUrl;
        const remoteMapMatches = urlToRemoteMap[appUrl] && (currentPath.startsWith(appUrl + '/') || currentPath === appUrl);
        
        return pathMatches || normalizedMatches || remoteMapMatches;
      });
    }

    // Si aún no encontramos, buscar en el mapeo de remotes por la ruta
    if (!app) {
      const remoteConfig = urlToRemoteMap[normalizedPath] || urlToRemoteMap[currentPath];
      if (remoteConfig) {
        // Buscar aplicación que tenga una URL que coincida con algún remote mapeado
        app = data.find(a => {
          const appUrl = a.url || '';
          return urlToRemoteMap[appUrl]?.remoteName === remoteConfig.remoteName;
        });
      }
    }

    if (app && app.id !== selectedApp?.id) {
      setTimeout(() => setSelectedApp(app), 0);
    } else if (!app && selectedApp && currentPath !== '/v2' && !currentPath.startsWith('/v2/')) {
      // Si no encontramos app pero hay una seleccionada y no estamos en /v2
      // Verificar si la ruta actual es una ruta anidada de la app seleccionada
      const selectedAppUrl = selectedApp.url || '';
      const isNestedRoute = currentPath.startsWith(selectedAppUrl + '/') || currentPath === selectedAppUrl;
      
      if (!isNestedRoute && 
          selectedAppUrl !== normalizedPath && 
          selectedAppUrl !== currentPath) {
        // Solo limpiar si realmente cambió la ruta y no es una ruta anidada
        setTimeout(() => setSelectedApp(null), 0);
      }
    }
  }, [location.pathname, data, selectedApp]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navbar sin título del medio */}
      <div className="flex p-6 justify-between items-center bg-slate-700 text-white shadow-md">
        <h1 className="text-2xl font-bold">Host</h1>

        {user && (
          <div className="flex gap-2 items-center">
            <span className="text-sm">
              Hi <span className="font-semibold">{user.username}</span>
              {user.rol && (
                <>
                  {" | "}
                  <span className="font-semibold">{user.rol}</span>
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Layout principal con sidebar y contenido */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar con menú de aplicaciones */}
        <aside
          className={`
            bg-zinc-700 text-white shadow-lg overflow-y-auto transition-all duration-300 ease-in-out
            ${isSidebarExpanded ? "w-64" : "w-16"}
          `}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              {isSidebarExpanded && (
                <h2 className="text-lg font-semibold text-white">
                  Aplicaciones
                </h2>
              )}
              <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="
                  p-2
                  rounded-lg
                  hover:bg-zinc-600
                  transition-colors
                  flex-shrink-0
                  ml-auto
                "
                aria-label={
                  isSidebarExpanded ? "Colapsar sidebar" : "Expandir sidebar"
                }
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isSidebarExpanded ? "" : "rotate-180"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                </svg>
              </button>
            </div>

            {/* Selector de ordenamiento */}
            {isSidebarExpanded && user && (
              <div className="mb-4 p-3 bg-zinc-800 rounded-lg border border-zinc-600">
                <label
                  htmlFor="sort-select"
                  className="block text-xs font-semibold text-zinc-200 mb-2"
                >
                  Ordenar por:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => {
                    const newSort = e.target.value as 'id' | 'name' | 'createdAt';
                    console.log('Sort changed to:', newSort);
                    setSortBy(newSort);
                  }}
                  className="
                    w-full
                    px-3
                    py-2
                    bg-zinc-900
                    text-white
                    border
                    border-zinc-500
                    rounded-lg
                    text-sm
                    font-medium
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    focus:border-blue-500
                    hover:bg-zinc-700
                    transition-colors
                    cursor-pointer
                  "
                >
                  <option value="id">ID (por defecto)</option>
                  <option value="name">Nombre</option>
                  <option value="createdAt">Fecha de creación</option>
                </select>
                {data && (
                  <p className="text-xs text-zinc-400 mt-2">
                    {data.length} aplicación{data.length !== 1 ? 'es' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Auth status en sidebar */}
            {isChecking && (
              <p
                className={`text-sm text-zinc-300 mb-4 ${
                  !isSidebarExpanded ? "hidden" : ""
                }`}
              >
                Verificando autenticación...
              </p>
            )}
            {authError && (
              <p
                className={`text-sm text-red-300 mb-4 ${
                  !isSidebarExpanded ? "hidden" : ""
                }`}
              >
                Error de autenticación: {authError}
              </p>
            )}

            {/* Lista de aplicaciones en sidebar */}
            {user && isLoading && (
              <p
                className={`text-sm text-zinc-300 ${
                  !isSidebarExpanded ? "hidden" : ""
                }`}
              >
                Cargando aplicaciones...
              </p>
            )}
            {user && error && (
              <p
                className={`text-sm text-red-300 ${
                  !isSidebarExpanded ? "hidden" : ""
                }`}
              >
                Error: {(error as Error).message}
              </p>
            )}

            {user && data && (
              <nav className="space-y-2">
                {data.map((app: Application) => {
                  const isActive = selectedApp?.id === app.id;
                  
                  return (
                    <button
                      key={app.id}
                      onClick={() => {
                        setSelectedApp(app);
                        const appUrl = app.url || `/v2/app/${app.id}`;
                        navigate(appUrl, { replace: true });
                      }}
                      className={`
                        w-full
                        text-left
                        ${isSidebarExpanded ? "p-3" : "p-2"}
                        rounded-lg
                        transition-all
                        duration-200
                        flex
                        items-center
                        cursor-pointer
                        ${isSidebarExpanded ? "gap-3" : "justify-center"}
                        ${
                          isSidebarExpanded
                            ? isActive
                              ? "bg-zinc-600 text-white shadow-md"
                              : "bg-zinc-800 text-zinc-200 hover:bg-zinc-600"
                            : "bg-transparent hover:bg-zinc-700/50"
                        }
                      `}
                      title={!isSidebarExpanded ? app.appName : undefined}
                    >
                    {/* Contenedor circular con iniciales - siempre visible */}
                    <div
                      className={`
                        flex-shrink-0
                        w-8
                        h-8
                        rounded-full
                        flex
                        items-center
                        justify-center
                        transition-all
                        duration-200
                        bg-blue-600 hover:bg-blue-500
                      `}
                    >
                      <span
                        className={`
                          text-xs
                          font-semibold
                          leading-none
                          text-white
                        `}
                      >
                        {getAppInitials(app.appName)}
                      </span>
                    </div>
                    {isSidebarExpanded && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">
                            {app.appName}
                          </span>
                        </div>
                        {app.description && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                            {app.description}
                          </p>
                        )}
                      </div>
                    )}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>
        </aside>

        {/* Container central para mostrar las apps */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {user && data ? (
            selectedApp ? (
              <AppViewer 
                app={selectedApp} 
                onBack={() => setSelectedApp(null)}
              />
            ) : (
              <HomeView 
                applications={data} 
                onAppSelect={(app) => {
                  setSelectedApp(app);
                  const appUrl = app.url || `/v2/app/${app.id}`;
                  navigate(appUrl, { replace: true });
                }}
              />
            )
          ) : !user && !isChecking && !authError ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-600 text-lg">
                Por favor, inicia sesión para ver las aplicaciones
              </p>
            </div>
          ) : null}
        </main>
      </div>

      <footer className="bg-slate-800 text-white text-center py-4">
        <p>&copy; {new Date().getFullYear()} Host. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default AppV2;
