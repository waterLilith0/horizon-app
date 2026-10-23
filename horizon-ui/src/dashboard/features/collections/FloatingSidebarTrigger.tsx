import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "cn";

export default function FloatingSidebarTrigger() {
  const { open } = useSidebar();
  return (
    <SidebarTrigger
      className={cn(
        "fixed left-2 z-10 dark:bg-white dark:text-black bg-black text-white transition-[left] duration-200 ease-linear",
        open ? "md:left-[calc(var(--sidebar-width)+0.5rem)]" : "",
      )}
      size={"lg"}
    />
  );
}
