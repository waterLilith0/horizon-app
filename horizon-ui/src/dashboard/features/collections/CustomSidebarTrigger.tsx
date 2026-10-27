import { useSidebar } from "@/components/ui/sidebar";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "cn";

export default function CustomSidebarTrigger() {
  const { toggleSidebar } = useSidebar();
  const { open } = useSidebar();

  return (
    <button
      className={cn(
        "fixed right-2 z-10 bg-primary hover:bg-secondary transition-[left] duration-200 ease-linear rounded-4xl mask-circle border-2 w-10 h-10 ",
        open ? "md:right-[calc(var(--sidebar-width)+0.5rem)]" : "",
      )}
      onClick={toggleSidebar}
    >
      <span>
        <FontAwesomeIcon icon={faBars} />
      </span>
    </button>
  );
}
