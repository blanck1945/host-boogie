import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { Application } from "./types/Application";
import { ApplicationCard } from "./components/ApplicationCard";
import { useYourIdAuth } from "./sdk/useYourIDAuth";

function App() {
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

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex p-6 justify-between items-center bg-slate-700 text-white">
        <h1>Host</h1>
        <p>Host is a platform for hosting decentralized applications.</p>

        {user && (
          <div className="flex gap-2">
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

      <div className="p-6">
        {/* Auth status */}
        {isChecking && <p>Verificando autenticación...</p>}
        {authError && (
          <p className="text-red-500">Error de autenticación: {authError}</p>
        )}

        {/* App listing */}
        {user && isLoading && <p>Cargando aplicaciones...</p>}
        {user && error && (
          <p className="text-red-500">Error: {(error as Error).message}</p>
        )}

        {user && data && (
          <ul
            className="
              grid 
              grid-cols-2
              md:grid-cols-4
              gap-6
            "
          >
            {data.map((app: Application) => (
              <li key={app.id}>
                <ApplicationCard application={app} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="mt-auto bg-slate-800 text-white text-center py-4">
        <p>&copy; {new Date().getFullYear()} Host. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
