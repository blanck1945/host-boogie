import { StrictMode, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import App from "./App";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// @ts-expect-error RemoteApp is not defined
const RemoteApp = lazy(() => import("remoteApp/App"));

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/pandora",
    element: <RemoteApp />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
