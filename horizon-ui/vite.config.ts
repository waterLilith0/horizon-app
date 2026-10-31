import { defineConfig, loadEnv, type PluginOption } from "vite";
import pkg from "./package.json" with { type: "json" };
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import faroUploader from "@grafana/faro-rollup-plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const uploadSourcemaps = !!env.FARO_API_KEY;
  return {
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
    build: { sourcemap: uploadSourcemaps ? "hidden" : false },
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      ...(uploadSourcemaps
        ? [
            faroUploader({
              appName: "horizon-ui",
              endpoint: env.FARO_UPLOAD_ENDPOINT,
              appId: env.FARO_APP_ID,
              stackId: env.FARO_STACK_ID,
              apiKey: env.FARO_API_KEY,
              gzipContents: true,
            }) as PluginOption,
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  };
});
