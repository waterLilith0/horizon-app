import { themeAtom } from "@/configAtoms";
import Footer from "@/components/custom/Footer";
import Navbar from "@/components/custom/Navbar";
import { useAtom } from "jotai";
import { Outlet, useLocation } from "react-router";
import NavButton from "@/components/custom/NavButton";
import { useState } from "react";

function Layout() {
  const location = useLocation();
  const isIframePage = location.pathname === "/yt-embed";
  const [theme] = useAtom(themeAtom);
  const [mobileMenuEnabled, setMobileMenuEnabled] = useState(false);

  return (
    <div className={`"flex flex-col ${theme === "dark" ? "dark" : ""}`}>
      <NavButton
        setMobileMenu={() => setMobileMenuEnabled(!mobileMenuEnabled)}
      />
      <Navbar mobileMenuEnabled={mobileMenuEnabled} />
      <main className="flex flex-col bg-secondary items-center">
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
