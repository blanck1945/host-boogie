import axios from "axios";

export interface YourIdUser {
  username: string;
  email: string;
  rol?: string;
}

export interface YourIdConfig {
  applicationBaseUrl: string; // VITE_APPLICATION_MICROSERVICE_URL
  yourIdLoginUrl: string; // VITE_YOUR_ID_LOGIN_URL
  env: "dev" | "prod"; // VITE_ENV
}

// Constantes para el manejo del token
const TOKEN_STORAGE_KEY = "authToken";

/**
 * Extrae el token de la URL si está presente en query parameters.
 * Útil después de la redirección desde el login.
 */
export function extractTokenFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  return token;
}

/**
 * Guarda el token en localStorage.
 */
export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

/**
 * Obtiene el token de localStorage.
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Elimina el token de localStorage.
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Obtiene los headers de autenticación con el token.
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Inicializa el token desde la URL si está presente.
 * Debe llamarse al inicio de la aplicación.
 */
export function initializeTokenFromUrl(): void {
  const token = extractTokenFromUrl();
  if (token) {
    saveToken(token);
    // Limpiar el token de la URL para no exponerlo
    const url = new URL(window.location.href);
    url.searchParams.delete("token");
    window.history.replaceState({}, "", url.toString());
  }
}

/**
 * Verifica autenticación contra /user/me.
 * - Si está autenticado, devuelve el user.
 * - Si responde 401, limpia el token, redirige al login de YourID y nunca resuelve.
 * - Si hay otro error, lanza Error.
 */
export async function ensureAuthenticated(
  config: YourIdConfig
): Promise<YourIdUser> {
  // Inicializar token desde URL si está presente
  initializeTokenFromUrl();

  const token = getToken();

  // Si no hay token, redirigir al login
  if (!token) {
    const fromUrl = window.location.href;
    const loginUrl = `${config.yourIdLoginUrl}?env=${
      config.env
    }&from_url=${encodeURIComponent(fromUrl)}`;

    window.location.href = loginUrl;
    // Nunca resolvemos: el browser se va a otra página
    return new Promise<YourIdUser>(() => {
      /* nunca resuelve */
    });
  }

  try {
    const res = await axios.get<YourIdUser>(
      `${config.applicationBaseUrl}/user/me`,
      {
        headers: getAuthHeaders(),
      }
    );

    return res.data;
  } catch (err: any) {
    if (err.response && err.response.status === 401) {
      // Token inválido o expirado
      removeToken();

      const fromUrl = window.location.href;
      const loginUrl = `${config.yourIdLoginUrl}?env=${
        config.env
      }&from_url=${encodeURIComponent(fromUrl)}`;

      window.location.href = loginUrl;
      // Nunca resolvemos: el browser se va a otra página
      return new Promise<YourIdUser>(() => {
        /* nunca resuelve */
      });
    }

    // Otros errores → los dejamos subir
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Error desconocido de autenticación";
    throw new Error(message);
  }
}
