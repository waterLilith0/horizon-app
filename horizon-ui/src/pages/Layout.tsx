import { themeAtom } from "@/configAtoms";
import Footer from "@/components/custom/Footer";
import Navbar from "@/components/custom/Navbar";
import { useAtom } from "jotai";
import { Outlet, useLocation } from "react-router";

function Layout() {
  const location = useLocation();
  const isIframePage = location.pathname === "/yt-embed";
  const [theme] = useAtom(themeAtom);

  return (
    <div className={`"flex flex-col ${theme === "dark" ? "dark" : ""}`}>
      <Navbar />
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
