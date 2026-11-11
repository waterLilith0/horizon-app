import "@/../index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { initTelemetry } from "@/shared/telemetry/faro.ts";
import { createAppRouter } from "@/app/router";

initTelemetry();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={createAppRouter()} />
  </StrictMode>,
);
