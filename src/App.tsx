import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { Application } from "./types/Application";
import { ApplicationCard } from "./components/ApplicationCard";
import { useEffect, useState } from "react";

function App() {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Este useEffect controla la lógica de chequeo de autenticación inicial
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get("http://localhost:3000/user/me", {
          withCredentials: true,
        });
        setIsAuthChecked(true);
      } catch (err: any) {
        if (err.response && err.response.status === 401) {
          // Si devuelve 401, hacer el login en el puerto 4001
          try {
            await axios.get("http://localhost:4001/login", {
              withCredentials: true,
            });
            setIsAuthChecked(true);
          } catch (loginErr: any) {
            setAuthError(
              loginErr?.response?.data?.message ||
                loginErr?.message ||
                "Error al hacer login"
            );
          }
        } else {
          setAuthError(
            err?.response?.data?.message ||
              err?.message ||
              "Error desconocido de autenticación"
          );
        }
      }
    };

    checkAuth();
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["applications"],
    enabled: isAuthChecked && !authError, // Solo correr si la autenticación está ok
    queryFn: async () => {
      const res = await axios.get("http://localhost:3000/applications", {
        withCredentials: true,
      });
      return res.data; // ← debería devolver un array de Application[]
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex p-6 justify-between items-center bg-slate-700 text-white">
        <h1>Host</h1>
        <p>Host is a platform for hosting decentralized applications.</p>
        <div className="flex gap-2">
          <Link to="/remote">Remote App</Link>
        </div>
      </div>

      <div className="p-6">
        {!isAuthChecked && !authError && <p>Verificando autenticación...</p>}
        {authError && (
          <p className="text-red-500">Error de autenticación: {authError}</p>
        )}
        {isAuthChecked && isLoading && <p>Cargando aplicaciones...</p>}
        {isAuthChecked && error && (
          <p className="text-red-500">Error: {(error as Error).message}</p>
        )}

        {isAuthChecked && data && (
          <ul
            className="
              grid 
              grid-cols-1
              sm:grid-cols-2 
              md:grid-cols-3
              lg:grid-cols-4 
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
        <p>&copy; {new Date().getFullYear()} Host Dec. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
