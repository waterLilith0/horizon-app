import type { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import SidebarTrigger from "./SidebarTrigger";

// The frame of a page: its content, and the sidebar with the button for it.
export default function Page({
  sidebar,
  children,
}: {
  sidebar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-col bg-secondary items-center grow shrink overflow-hidden ps-20 pe-20">
      <section className="flex flex-col items-center bg-primary w-full p-2 overflow-hidden">
        <SidebarTrigger />
        <AppSidebar>{sidebar}</AppSidebar>
        {children}
      </section>
    </main>
  );
}
