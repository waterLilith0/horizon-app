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
    <div>
      <nav className="h-screen w-1/3 flex flex-col fixed items-center z-50 dark:text-sidebar-foreground bg-sidebar dark:bg-sidebar shrink-0 text-sidebar-foreground lg:sticky lg:top-0 lg:w-full lg:h-12 lg:flex-row">
        <ul className="flex w-full h-full flex-col items-center list-none m-0 p-0 lg:flex-row">
          {navLinks.map((item) => {
            const linkKey = item.link;
            return (
              <li
                key={linkKey}
                className="flex h-full w-full justify-center items-center lg:first:justify-self-start"
              >
                <NavLink
                  to={item.link}
                  className="flex h-full w-full no-underline justify-center items-center px-5 hover:bg-gray-500 hover::h-full hover:w-full"
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
                className="flex h-full w-full items-center justify-center lg:first:justify-self-start"
              >
                <a
                  href={item.link}
                  target="_blank"
                  className="flex justify-center h-full w-full items-center px-5 hover:bg-gray-500 hover::h-full hover:w-full"
                >
                  <FontAwesomeIcon icon={item.icon} className="mr-2" />
                  {item.name}
                </a>
              </li>
            );
          })}
          <li className="flex items-center justify-center h-full w-full lg:last:ml-auto lg:last:pr-5 lg:justify-end">
            <p className="lg:hidden">Dark Mode</p>
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
    </div>
  );
}

export default memo(Navbar);
