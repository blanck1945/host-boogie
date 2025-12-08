import axios from "axios";

export interface YourIdUser {
  username: string;
  email: string;
}

export interface YourIdConfig {
  applicationBaseUrl: string; // VITE_APPLICATION_MICROSERVICE_URL
  yourIdLoginUrl: string; // VITE_YOUR_ID_LOGIN_URL
  env: "dev" | "prod"; // VITE_ENV
}

/**
 * Verifica autenticación contra /user/me.
 * - Si está autenticado, devuelve el user.
 * - Si responde 401, redirige al login de YourID y nunca resuelve.
 * - Si hay otro error, lanza Error.
 */
export async function ensureAuthenticated(
  config: YourIdConfig
): Promise<YourIdUser> {
  try {
    const res = await axios.get<YourIdUser>(
      `${config.applicationBaseUrl}/user/me`,
      {
        withCredentials: true,
      }
    );

    return res.data;
  } catch (err: any) {
    if (err.response && err.response.status === 401) {
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
