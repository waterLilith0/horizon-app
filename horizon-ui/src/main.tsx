import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import Layout from "./pages/Layout.tsx";
import Home from "./pages/Home.tsx";
import NotFound from "./pages/ErrorPages/NotFound.tsx";
import About from "./pages/About.tsx";
import YTEmbed from "./pages/YTEmbed.tsx";
import Gallery from "./pages/Gallery.tsx";
import Testing from "./pages/Testing.tsx";
import PrivacyPolicy from "./pages/Legal/PrivacyPolicy.tsx";
import Impressum from "./pages/Legal/Impressum.tsx";

const router = createBrowserRouter([
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
      { path: "*", element: <NotFound /> },
      { path: "testing", element: <Testing /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
