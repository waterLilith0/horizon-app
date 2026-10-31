import { defineConfig } from "vite";
import pkg from "./package.json" with { type: "json" };
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "https://dev.waterlilith.space",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: "localhost", // so session cookies stick locally
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  // Alloy's faro.receiver downloads these to de-minify stack traces.
  build: { sourcemap: true },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
