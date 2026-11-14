import { Outlet } from "react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UploadProvider } from "@/components/global-upload";
import { localAdapter } from "@uploadcn/core";
import SidebarTrigger from "./SidebarTrigger";
import Footer from "./Footer";
import { useApplyTheme } from "@/hooks/useResolvedTheme";
import AppSidebar from "./AppSidebar";

const uploadAdapter = localAdapter();

export default function DashboardLayout() {
  useApplyTheme();

  return (
    <>
      <UploadProvider
        adapter={uploadAdapter}
        accept="application/json,.json"
        maxSize={20_000_000}
        maxFiles={5}
      >
        <SidebarProvider
          defaultOpen={false}
          style={
            {
              "--sidebar-width": "30rem",
              "--sidebar-width-mobile": "2rem",
            } as React.CSSProperties
          }
        >
          <SidebarTrigger />
          <div className="flex flex-col justify-items-center-safe items-center w-full h-full grow">
            <main className="md:max-w-300 md:w-[80%] bg-primary w-full h-full grow">
              <Outlet />
            </main>
          </div>
          <AppSidebar />
        </SidebarProvider>
      </UploadProvider>
      <Footer />
    </>
  );
}
