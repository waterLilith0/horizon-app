import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAtom } from "jotai";
import { themeAtom } from "./configAtoms";

export default function ThemeMenu() {
  const [theme, setTheme] = useAtom(themeAtom);

  function changeTheme(newTheme: typeof theme) {
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
  }

  const themes = [
    { label: "System", value: "system" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
  ];

  return (
    <Select onValueChange={changeTheme}>
      <SelectTrigger aria-placeholder="Theme">
        <SelectValue>{theme}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup defaultValue={theme}>
          {themes.map((item) => (
            <SelectItem key={item.value} id={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
