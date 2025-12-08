import { useEffect, useState } from "react";
import {
  ensureAuthenticated,
  type YourIdConfig,
  type YourIdUser,
} from "./yourid-sdk";

interface UseYourIdAuthResult {
  user: YourIdUser | null;
  isChecking: boolean;
  authError: string | null;
}

/**
 * Hook React para manejar el flujo de autenticación con YourID.
 */
export function useYourIdAuth(config: YourIdConfig): UseYourIdAuthResult {
  const [user, setUser] = useState<YourIdUser | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const u = await ensureAuthenticated(config);
        if (!cancelled) {
          setUser(u);
          setAuthError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setAuthError(err.message || "Error desconocido de autenticación");
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [config.applicationBaseUrl, config.yourIdLoginUrl, config.env]);

  return { user, isChecking, authError };
}
