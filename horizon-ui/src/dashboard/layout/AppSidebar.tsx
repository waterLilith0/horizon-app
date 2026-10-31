import type { ReactNode } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import AccountDropdown from "../features/account/AccountDropdown";

// The sidebar every page has: the account menu, which is where users log in,
// and whatever the page adds below it.
export default function AppSidebar({ children }: { children?: ReactNode }) {
  return (
    <Sidebar side="right">
      <SidebarHeader>
        <SidebarContent>
          <AccountDropdown />
        </SidebarContent>
      </SidebarHeader>
      {children}
    </Sidebar>
  );
}
