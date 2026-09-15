import { memo, useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import { themeAtom } from "../../configAtoms";
import { Switch } from "@/components/ui/switch";
import { NavLink } from "react-router";
import { links, socials } from "@/dataAtoms";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Navbar() {
  const [theme, setTheme] = useAtom(themeAtom);
  const [navLinks] = useAtom(links);
  const [socialLinks] = useAtom(socials);

  const initializeTheme = useCallback(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      return;
    }
    localStorage.setItem("theme", "dark");
    setTheme("dark");
  }, [setTheme]);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <nav className="sticky top-0 flex flex-row items-center z-50 text-sidebar-foreground dark:text-sidebar-foreground bg-sidebar dark:bg-sidebar w-full h-12 shrink-0">
      <ul className="flex w-full h-full flex-row items-center list-none m-0 p-0">
        {navLinks.map((item) => {
          const linkKey = item.link;
          return (
            <li
              key={linkKey}
              className="flex h-full items-center first:justify-self-start"
            >
              <NavLink
                to={item.link}
                className="flex h-full no-underline items-center px-5 hover:bg-gray-500 hover::h-full hover:w-full"
              >
                {item.name}
              </NavLink>
            </li>
          );
        })}
        {socialLinks.map((item) => {
          const linkKey = item.link;
          return (
            <li
              key={linkKey}
              className="flex h-full items-center first:justify-self-start"
            >
              <a
                href={item.link}
                target="_blank"
                className="flex justify-end h-full items-center px-5 hover:bg-gray-500 hover::h-full hover:w-full"
              >
                <FontAwesomeIcon icon={item.icon} className="mr-2" />
                {item.name}
              </a>
            </li>
          );
        })}
        <li className="flex items-center h-full last:ml-auto last:pr-5">
          <Switch
            checked={theme === "dark"}
            size="default"
            className={theme}
            onCheckedChange={(checked) => {
              const newTheme = checked ? "dark" : "light";
              localStorage.setItem("theme", newTheme);
              setTheme(newTheme);
            }}
          />
        </li>
      </ul>
    </nav>
  );
}

export default memo(Navbar);
