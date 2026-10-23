import { useApplyTheme } from "@/shared/theme/useResolvedTheme";
import { Outlet } from "react-router";
import { SidebarProvider } from "@/components/ui/sidebar";

import AccountDropdown from "@/dashboard/features/account/AccountDropdown";
import Footer from "@/shared/Footer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function DashboardLayout() {
  useApplyTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col text-base">
        <AccountDropdown />
        <SidebarProvider>
          <main className="flex flex-col bg-secondary items-center grow">
            <div className="flex flex-col items-center bg-primary w-[80%] p-2 overflow-hidden">
              <Outlet />
            </div>
          </main>
        </SidebarProvider>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}

export default DashboardLayout;
