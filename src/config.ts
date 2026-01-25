export const envConfig = {
    applicationBaseUrl: (window as any)._env_?.VITE_APPLICATION_MICROSERVICE_URL || import.meta.env.VITE_APPLICATION_MICROSERVICE_URL,
    yourIdLoginUrl: (window as any)._env_?.VITE_YOUR_ID_LOGIN_URL || import.meta.env.VITE_YOUR_ID_LOGIN_URL,
    env: (window as any)._env_?.VITE_ENV || import.meta.env.VITE_ENV,
  };