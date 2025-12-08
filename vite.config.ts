import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: "host-dec",
      remotes: {
        remoteApp: "https://remote-atena.vercel.app/assets/remoteEntry.js",
        remoteReactStreamlit: "http://localhost:5001/assets/remoteEntry.js", // o la URL que uses
      },
      shared: ["react", "react-dom", "react-router-dom"], // 👈 CAMBIO
    }),
  ],
  build: {
    target: "esnext",
    minify: false,
    cssCodeSplit: false,
    modulePreload: false,
  },
});
