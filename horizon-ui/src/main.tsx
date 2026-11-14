import "@/../index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { initTelemetry } from "@/features/telemetry/faro";
import { createAppRouter } from "@/router";

initTelemetry();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={createAppRouter()} />
  </StrictMode>,
);
