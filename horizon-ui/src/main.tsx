import "@/../index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { initTelemetry } from "@/shared/telemetry/faro.ts";
import { enableMocks } from "@/dashboard/mocks/enable";
import { createAppRouter } from "@/app/router";

initTelemetry();
await enableMocks();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={createAppRouter()} />
  </StrictMode>,
);
