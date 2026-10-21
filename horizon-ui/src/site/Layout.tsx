import { Outlet, useLocation } from "react-router";
import { useState } from "react";
import Navbar from "./Navbar";
import Footer from "@/shared/Footer";
import { cn } from "cn";
import { useApplyTheme } from "@/shared/theme/useResolvedTheme";

function Layout() {
  useApplyTheme();

  const location = useLocation();
  const isIframePage = location.pathname === "/yt-embed";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className={"flex flex-col"}>
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
