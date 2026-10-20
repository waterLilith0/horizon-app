import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import packageJson from "../package.json";
import "../index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import Layout from "./site/Layout.tsx";
import Home from "./site/pages/Home.tsx";
import NotFound from "./shared/NotFound.tsx";
import About from "./site/pages/About.tsx";
import YTEmbed from "./site/pages/YTEmbed.tsx";
import Gallery from "./site/pages/Gallery.tsx";
import PrivacyPolicy from "./shared/legal/PrivacyPolicy.tsx";
import Impressum from "./shared/legal/Impressum.tsx";
import {
  getWebInstrumentations,
  initializeFaro,
  ReactIntegration,
  createReactRouterV7DataOptions,
} from "@grafana/faro-react";
import { matchRoutes } from "react-router";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import { withFaroRouterInstrumentation } from "@grafana/faro-react";
import VRChatShowcase from "./site/pages/VRChatShowcase.tsx";

const faroEnabled = import.meta.env.PROD;

if (faroEnabled) {
  initializeFaro({
    url: "https://faro-collector-prod-eu-west-2.grafana.net/collect/804f032a4ca18a06c8740fe8e378c416",
    app: {
      name: "horizon-ui",
      version: packageJson.version,
      environment: "production",
    },
    sessionTracking: {
      samplingRate: 0.4,
    },
    instrumentations: [
      // Mandatory, omits default instrumentation otherwise.
      ...getWebInstrumentations(),
      // Tracing package to get end-to-end visibility for HTTP requests.
      new TracingInstrumentation(),
      // React integration for React applications.
      new ReactIntegration({
        router: createReactRouterV7DataOptions({
          matchRoutes,
        }),
      }),
    ],
  });
}

const _browserRouter = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: "home", element: <Home /> },
      { path: "about-contact", element: <About /> },
      { path: "gallery", element: <Gallery /> },
      { path: "yt-embed", element: <YTEmbed /> },
      { path: "privacy", element: <PrivacyPolicy /> },
      { path: "impressum", element: <Impressum /> },
      { path: "vrc", element: <VRChatShowcase /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    path: "/dashboard",
    lazy: async () => ({
      Component: (await import("@/dashboard/DashboardLayout")).default,
    }),
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import("@/dashboard/pages/Dashboard.tsx")).default,
        }),
      },
    ],
  },
]);

async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_MOCKS === "false")
    return;
  const { worker } = await import("./dashboard/mocks/browser.ts");
  await worker.start({ onUnhandledFrame: "bypass" });
}

const router = faroEnabled
  ? withFaroRouterInstrumentation(_browserRouter)
  : _browserRouter;

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
});
