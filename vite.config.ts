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
      name: "host",
      remotes: {
        remoteApp: "https://remote-atena.vercel.app/assets/remoteEntry.js",
        // remoteApp: "http://localhost:5001/assets/remoteEntry.js",
        remoteReactStreamlit:
          "https://boogie-blizzard.vercel.app/assets/remoteEntry.js",
        // remoteReactStreamlit: "http://localhost:5002/assets/remoteEntry.js",
        // "https://boogie-blizzard.vercel.app/assets/remoteEntry.js",
        remoteInformation:
          "https://blizzard-admin.vercel.app/assets/remoteEntry.js",
        // remoteInformation: "http://localhost:5003/assets/remoteEntry.js",
      },
      shared: ["react", "react-dom", "react-router-dom"],
    }),
  ],
  build: {
    target: "esnext",
    minify: false,
    cssCodeSplit: false,
    modulePreload: false,
  },
});
