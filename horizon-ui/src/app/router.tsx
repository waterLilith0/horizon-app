import NotFound from "@/shared/NotFound.tsx";
import PrivacyPolicy from "@/shared/legal/PrivacyPolicy.tsx";
import Impressum from "@/shared/legal/Impressum.tsx";
import { createBrowserRouter, Navigate } from "react-router";
import { env } from "@/shared/config/env";
import { withFaroRouterInstrumentation } from "@grafana/faro-react";
import DashboardLayout from "@/dashboard/layout/DashboardLayout";
import Dashboard from "@/dashboard/pages/Dashboard";
import ResetPassword from "@/dashboard/pages/ResetPassword";
import Search from "@/dashboard/pages/Search";
import VerifyEmail from "@/dashboard/pages/VerifyEmail";

const routes = [
  {
    path: "/",
    element: <DashboardLayout />,
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
      { path: "reset-password", element: <ResetPassword /> },
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
