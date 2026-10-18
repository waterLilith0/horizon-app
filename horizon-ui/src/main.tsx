import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import packageJson from "../package.json";
import "../index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import Layout from "./pages/MainPage/Layout.tsx";
import Home from "./pages/MainPage/Home.tsx";
import NotFound from "./pages/ErrorPages/NotFound.tsx";
import About from "./pages/MainPage/About.tsx";
import YTEmbed from "./pages/MainPage/YTEmbed.tsx";
import Gallery from "./pages/MainPage/Gallery.tsx";
import PrivacyPolicy from "./pages/Legal/PrivacyPolicy.tsx";
import Impressum from "./pages/Legal/Impressum.tsx";
import {
  getWebInstrumentations,
  initializeFaro,
  ReactIntegration,
  createReactRouterV7DataOptions,
} from "@grafana/faro-react";
import { matchRoutes } from "react-router";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import { withFaroRouterInstrumentation } from "@grafana/faro-react";
import VRChatShowcase from "./pages/MainPage/VRChatShowcase.tsx";
import ApiLayout from "./pages/ApiDashboard/ApiLayout.tsx";
import ApiHome from "./pages/ApiDashboard/ApiHome.tsx";
import Account from "./pages/ApiDashboard/Account.tsx";

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
    element: <ApiLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <ApiHome /> },
      { path: "account", element: <Account /> },
    ],
  },
]);

const router = faroEnabled
  ? withFaroRouterInstrumentation(_browserRouter)
  : _browserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
