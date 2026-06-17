import { memo, useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useAtom } from "jotai";
import { themeAtom } from "../../atoms";
import { Switch } from "@/components/ui/switch";

const StickyNavbar = styled.nav`
  display: flex;
  align-items: center;
  justify-content: left;
  position: sticky;
  background-color: darkgray;
  width: 100%;
  height: 50px;
  z-index: 1000;
  flex-shrink: 0;

  ul {
    display: flex;
    flex-direction: row;
    list-style: none;
    gap: 20px;
    height: 100%;
    margin: 0;
    padding: 0;

    li:first-child {
      justify-self: left;
    }

    li {
      display: flex;
      align-items: center;
      height: 100%;
    }
  }
`;

const StyledLink = styled.a`
  color: white;
  text-decoration: none;
  display: block;
  height: 100%;
  padding: 0 20px;
  align-items: center;
  display: flex;
  transition: background-color 0.2s ease;

  &:hover {
    color: white;
    text-decoration: none;
    background-color: gray;
  }
`;

function Navbar() {
  const [links] = useState([{ link: "http://localhost:5173", name: "Home" }]);
  const [theme, setTheme] = useAtom(themeAtom);

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
    <StickyNavbar>
      <ul>
        {links.map((item) => {
          const randomKey = crypto.randomUUID();
          return (
            <li key={randomKey}>
              <StyledLink href={item.link}>{item.name}</StyledLink>
            </li>
          );
        })}
        <Switch
          checked={theme === "dark"}
          onCheckedChange={(checked) => {
            const newTheme = checked ? "dark" : "light";
            localStorage.setItem("theme", newTheme);
            setTheme(newTheme);
          }}
        />
      </ul>
    </StickyNavbar>
  );
}

export default memo(Navbar);
