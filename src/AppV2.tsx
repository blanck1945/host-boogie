import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  useState,
  Suspense,
  lazy,
  type ComponentType,
  Component,
  type ReactNode,
  useEffect,
} from "react";
import type { Application } from "./types/Application";
import { ApplicationCard } from "./components/ApplicationCard";
import { useYourIdAuth } from "./sdk/useYourIDAuth";

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

// Componentes lazy para remotes de Module Federation
const RemoteSeedApp = lazy(async () => {
  try {
    // @ts-expect-error - Module Federation remote
    const module = await import("remoteApp/App");
    // Asegurarse de que el módulo tenga un default export
    if (module.default) {
      return module;
    }
    // Si no hay default, intentar usar el export nombrado App
    if (module.App) {
      return { default: module.App };
    }
    throw new Error("No se encontró un componente válido en remote-seed/App");
  } catch (err) {
    console.error("Error loading remote-seed/App:", err);
    // To prevent breaking Suspense, return a dummy module
    return { default: () => <div>Error loading remote app.</div> };
  }
});

// Mapeo de remotes de Module Federation por URL
const remoteComponents: Record<string, ComponentType<Record<string, never>>> = {
  "/atena": RemoteSeedApp,
  // Agregar más remotes aquí según sea necesario
};

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

function AppV2() {
  // 1) Usamos el SDK
  const { user, isChecking, authError } = useYourIdAuth({
    applicationBaseUrl: import.meta.env.VITE_APPLICATION_MICROSERVICE_URL,
    yourIdLoginUrl: import.meta.env.VITE_YOUR_ID_LOGIN_URL,
    env: import.meta.env.VITE_ENV, // "dev" | "prod"
  });

  // 2) Cargar aplicaciones SOLO cuando el usuario está autenticado
  const { data, isLoading, error } = useQuery({
    queryKey: ["applications"],
    enabled: !!user && !authError,
    queryFn: async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_APPLICATION_MICROSERVICE_URL}/applications`,
        { withCredentials: true }
      );
      return res.data as Application[];
    },
  });

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  // Detectar si la app es un remote de Module Federation
  const RemoteComponent = selectedApp
    ? remoteComponents[selectedApp.url]
    : null;
  const isRemoteApp = RemoteComponent !== undefined;

  useEffect(() => {
    if (selectedApp) {
      console.log("selectedApp", selectedApp);
    }
  }, [selectedApp]);

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
                {data.map((app: Application) => (
                  <button
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
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
                          ? selectedApp?.id === app.id
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
                        ${
                          selectedApp?.id === app.id
                            ? "bg-blue-500 hover:bg-blue-400"
                            : "bg-blue-600 hover:bg-blue-500"
                        }
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
                ))}
              </nav>
            )}
          </div>
        </aside>

        {/* Container central para mostrar las apps */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {user && data && (
            <>
              {selectedApp ? (
                <div className="flex-1 flex flex-col h-full">
                  {/* Barra superior con información de la app */}
                  <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedApp(null)}
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
                          {selectedApp.appName}
                          {selectedApp.description && (
                            <>
                              {" | "}
                              <span className="font-normal text-slate-600">
                                {selectedApp.description}
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
                          selectedApp.isActive
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : "bg-red-100 text-red-700 border border-red-300"
                        }
                      `}
                    >
                      {selectedApp.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  {/* Contenedor para la aplicación */}
                  <div className="flex-1 relative">
                    {selectedApp.isActive ? (
                      isRemoteApp && RemoteComponent ? (
                        // Renderizar remote de Module Federation directamente
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
                              <RemoteComponent />
                            </ErrorBoundary>
                          </div>
                        </Suspense>
                      ) : (
                        // Renderizar aplicación externa en iframe
                        <iframe
                          src={selectedApp.url || ""}
                          className="w-full h-full border-0"
                          title={selectedApp.appName || "Aplicación"}
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                        />
                      )
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
              ) : (
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
                    {data && data.length > 0 && (
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">
                          Aplicaciones Disponibles
                        </h2>
                        <ul
                          className="
                            grid 
                            grid-cols-1
                            md:grid-cols-2
                            lg:grid-cols-3
                            gap-6
                          "
                        >
                          {data.map((app: Application) => (
                            <li key={app.id}>
                              <ApplicationCard application={app} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {!user && !isChecking && !authError && (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-600 text-lg">
                Por favor, inicia sesión para ver las aplicaciones
              </p>
            </div>
          )}
        </main>
      </div>

      <footer className="bg-slate-800 text-white text-center py-4">
        <p>&copy; {new Date().getFullYear()} Host. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default AppV2;
