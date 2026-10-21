import Layout from "@/site/Layout.tsx";
import Home from "@/site/pages/Home.tsx";
import NotFound from "@/shared/NotFound.tsx";
import About from "@/site/pages/About.tsx";
import YTEmbed from "@/site/pages/YTEmbed.tsx";
import Gallery from "@/site/pages/Gallery.tsx";
import PrivacyPolicy from "@/shared/legal/PrivacyPolicy.tsx";
import Impressum from "@/shared/legal/Impressum.tsx";
import VRChatShowcase from "@/site/pages/VRChatShowcase.tsx";
import { createBrowserRouter, Navigate } from "react-router";
import { env } from "@/shared/config/env";
import { withFaroRouterInstrumentation } from "@grafana/faro-react";

const routes = [
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: "home", element: <Navigate to="/" replace /> },
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
];

export const createAppRouter = () => {
  const router = createBrowserRouter(routes);
  return env.faro.enabled ? withFaroRouterInstrumentation(router) : router;
};
