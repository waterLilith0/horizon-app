import NotFound from "@/pages/NotFound";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import Impressum from "@/pages/legal/Impressum";
import { createBrowserRouter, Navigate } from "react-router";
import { env } from "@/config/env";
import { withFaroRouterInstrumentation } from "@grafana/faro-react";
import Layout from "@/layout/Layout";
import Dashboard from "./pages/Dashboard";
import PasswordReset from "./pages/PasswordReset";
import VerifyEmail from "./pages/VerifyEmail";
import Search from "./pages/Search";

const routes = [
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "home",
        element: <Navigate to="/" replace />,
      },
      { path: "search", element: <Search /> },
      { path: "verify-email", element: <VerifyEmail /> },
      { path: "reset-password", element: <PasswordReset /> },
      { path: "privacy", element: <PrivacyPolicy /> },
      { path: "impressum", element: <Impressum /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];

export const createAppRouter = () => {
  const router = createBrowserRouter(routes);
  return env.faro.enabled ? withFaroRouterInstrumentation(router) : router;
};
