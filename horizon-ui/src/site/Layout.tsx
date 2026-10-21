import { themeAtom } from "@/shared/theme/configAtoms";

import { useAtomValue } from "jotai";
import { Outlet, useLocation } from "react-router";
import { useState } from "react";
import Navbar from "./Navbar";
import Footer from "@/shared/Footer";
import { cn } from "cn";

function Layout() {
  const location = useLocation();
  const isIframePage = location.pathname === "/yt-embed";
  const theme = useAtomValue(themeAtom);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className={cn("flex flex-col", theme === "dark" && "dark")}>
      <Navbar
        open={mobileMenuOpen}
        onToggle={() => setMobileMenuOpen((v) => !v)}
      />
      <main className="flex flex-col bg-secondary items-center grow">
        <div
          className={cn(
            "flex flex-col items-center bg-primary w-[80%] p-2",
            isIframePage ? "overflow-hidden h-full" : "overflow-hidden",
          )}
        >
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
