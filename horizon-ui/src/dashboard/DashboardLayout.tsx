import { useApplyTheme } from "@/shared/theme/useResolvedTheme";
import { Outlet } from "react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import Footer from "@/shared/Footer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function DashboardLayout() {
  useApplyTheme();
  return (
    <QueryClientProvider client={queryClient}>
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
      <Footer />
    </QueryClientProvider>
  );
}
