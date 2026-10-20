import { themeAtom } from "@/shared/theme/configAtoms";

import { useAtom } from "jotai";
import { Outlet, useLocation } from "react-router";
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Footer from "@/shared/Footer";

function Layout() {
  const location = useLocation();
  const isIframePage = location.pathname === "/yt-embed";
  const [theme] = useAtom(themeAtom);
  const [mobileMenuEnabled, setMobileMenuEnabled] = useState(false);
  useEffect(() => setMobileMenuEnabled(false), [location.pathname]);
  return (
    <div className={`flex flex-col ${theme === "dark" ? "dark" : ""}`}>
      <Navbar
        open={mobileMenuEnabled}
        onToggle={() => setMobileMenuEnabled((v) => !v)}
      />
      <main className="flex flex-col bg-secondary items-center grow">
        <div
          className={`flex flex-col items-center bg-primary w-[80%] p-2 ${isIframePage ? "overflow-none h-full" : "overflow-hidden"}`}
        >
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
