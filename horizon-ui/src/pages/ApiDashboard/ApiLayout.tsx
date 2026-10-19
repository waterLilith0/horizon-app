import { useResolvedTheme } from "@/useResolvedTheme";
import Footer from "@/components/custom/BaseComponents/Footer";
import { Outlet } from "react-router";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AllCollections } from "@/components/custom/ApiComponents/AllCollections";
import AccountDropdown from "@/components/custom/ApiComponents/AccountDropdown";
import { useEffect, useState } from "react";

function FloatingSidebarTrigger() {
  const { open } = useSidebar();
  return (
    <SidebarTrigger
      className={`fixed left-2 z-10 dark:bg-white dark:text-black bg-black text-white transition-[left] duration-200 ease-linear ${
        open ? "md:left-[calc(var(--sidebar-width)+0.5rem)]" : ""
      }`}
      size={"lg"}
    />
  );
}

function ApiLayout() {
  const theme = useResolvedTheme();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    return () => root.classList.remove("dark");
  }, [theme]);

  const [selectedCollection, setSelectedCollection] = useState(0);
  return (
    <div className="flex flex-col">
      <AccountDropdown className="w-20 fixed right-2 top-2 dark:bg-white dark:text-black bg-black text-white" />
      <SidebarProvider>
        <AllCollections
          selectedCollection={selectedCollection}
          setSelectedCollection={setSelectedCollection}
        />
        <main className="flex flex-col bg-secondary items-center grow">
          <div className="flex flex-col items-center bg-primary w-[80%] p-2 overflow-hidden">
            <Outlet context={{ selectedCollection }} />
            <FloatingSidebarTrigger />
          </div>
        </main>
      </SidebarProvider>
      <Footer />
    </div>
  );
}

export default ApiLayout;
