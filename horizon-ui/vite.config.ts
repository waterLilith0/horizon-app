import { defineConfig, loadEnv } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import faroUploader from "@grafana/faro-rollup-plugin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      faroUploader({
        appName: "horizon-ui",
        endpoint: "https://faro-api-prod-eu-west-2.grafana.net/faro/api/v1",
        appId: "7883",
        stackId: "1602980",
        apiKey: env.FARO_API_KEY,
        gzipContents: true,
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  };
});
