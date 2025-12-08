// ✅ HOST: main.tsx
import { StrictMode, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom"; // 👈 CAMBIO ACÁ
import App from "./App";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// @ts-expect-error RemoteApp is not defined
const RemoteApp = lazy(() => import("remoteApp/App"));
// @ts-expect-error RemoteReactStreamlit is not defined
const RemoteStreamlitApp = lazy(() => import("remoteReactStreamlit/routes"));

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/atena",
    element: <RemoteApp />,
  },
  {
    path: "/blizzard/*", // opcionalmente con wildcard
    element: <RemoteStreamlitApp />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
