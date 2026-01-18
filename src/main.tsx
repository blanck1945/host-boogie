// ✅ HOST: main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom"; // 👈 CAMBIO ACÁ
import App from "./App";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppV2 from "./AppV2";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/v2",
    element: <AppV2 />,
  },
  {
    path: "/atena/*",
    element: <AppV2 />,
  },
  {
    path: "/blizzard/*", // opcionalmente con wildcard
    element: <AppV2 />,
  },
  { 
    path: "/blizzard-admin",
    element: <AppV2 />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
