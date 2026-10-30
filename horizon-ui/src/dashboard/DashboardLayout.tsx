import { useApplyTheme } from "@/shared/theme/useResolvedTheme";
import { Outlet } from "react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import Footer from "@/shared/Footer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UploadProvider } from "@/components/global-upload";
import { localAdapter } from "@uploadcn/core";

const queryClient = new QueryClient();
const uploadAdapter = localAdapter();

export default function DashboardLayout() {
  useApplyTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <UploadProvider
        persist
        adapter={uploadAdapter}
        accept={"application/json"}
        maxSize={20_000_000}
        maxFiles={5}
      >
        <SidebarProvider
          style={
            {
              "--sidebar-width": "30rem",
              "--sidebar-width-mobile": "2rem",
            } as React.CSSProperties
          }
        >
          <Outlet />
        </SidebarProvider>
      </UploadProvider>
      <Footer />
    </QueryClientProvider>
  );
}
