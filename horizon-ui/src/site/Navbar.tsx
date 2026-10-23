import { NavLink } from "react-router";
import { links, socials } from "@/site/content";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";
import NavbarThemeMenu from "./ThemeMenu";

function Navbar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <>
      <nav
        id="navbar"
        className="z-50 w-full text-sidebar-foreground lg:sticky lg:top-0 lg:bg-sidebar"
      >
        <button
          type="button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="nav-links"
          onClick={onToggle}
          className={cn(
            "fixed top-3 z-51 inline-flex size-11 items-center justify-center rounded-full bg-sidebar text-sidebar-foreground shadow-lg ring-1 ring-sidebar-border transition-[left] duration-200 hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring lg:hidden",
            open ? "left-[calc(min(16rem,80vw)+0.75rem)]" : "left-3",
          )}
        >
          <FontAwesomeIcon icon={open ? faXmark : faBars} className="size-5" />
        </button>

        <div
          aria-hidden="true"
          onClick={onToggle}
          className={cn(
            "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
            open ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />

        <ul
          id="nav-links"
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex h-dvh w-64 max-w-[80vw] flex-col items-stretch overflow-y-auto bg-sidebar m-0 p-0 list-none shadow-xl transition-[transform,visibility] duration-200",
            open ? "translate-x-0" : "-translate-x-full invisible",
            "lg:visible lg:static lg:h-12 lg:w-full lg:max-w-none lg:translate-x-0 lg:flex-row lg:items-center lg:overflow-visible lg:shadow-none",
          )}
        >
          {[...links, ...socials].map((item) => {
            return (
              <li
                key={item.link}
                className="flex min-h-12 lg:h-full w-full justify-center items-center lg:first:justify-self-start"
              >
                {/* TODO: render icons */}
                <NavLink
                  onClick={onToggle}
                  to={item.link}
                  className="flex h-full w-full text-base py-3 lg:py-0 no-underline justify-center items-center px-5 hover:bg-gray-500 hover:h-full hover:w-full"
                >
                  {item.name}
                </NavLink>
              </li>
            );
          })}
          <li className="flex min-h-12 lg:h-full w-full items-center justify-center px-5 lg:w-auto lg:ml-auto">
            <NavbarThemeMenu className="h-11 lg:h-8 w-full lg:w-32 border-transparent bg-transparent hover:bg-gray-500 text-base lg:text-sm" />
          </li>
        </ul>
      </nav>
    </>
  );
}

export default Navbar;
