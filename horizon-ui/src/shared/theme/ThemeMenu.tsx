import { useAtom } from "jotai";
import { z } from "zod";
import { themeAtom } from "./configAtoms";
import {
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

const THEMES = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
] as const;

const themeSchema = z.enum(["system", "light", "dark"]);

export default function ThemeMenu({ className }: { className?: string }) {
  const [theme, setTheme] = useAtom(themeAtom);

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(v) => setTheme(themeSchema.parse(v))}
          >
            {THEMES.map((t) => (
              <DropdownMenuRadioItem key={t.value} value={t.value}>
                {t.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
