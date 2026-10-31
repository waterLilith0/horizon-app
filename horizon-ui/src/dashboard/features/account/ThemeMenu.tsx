import { useAtom } from "jotai";
import { themeAtom } from "@/shared/theme/configAtoms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { THEMES, themeSchema } from "@/shared/theme/useResolvedTheme";
import { SidebarMenuSubButton } from "@/components/ui/sidebar";

export default function ThemeMenu() {
  const [theme, setTheme] = useAtom(themeAtom);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-md w-full"
        nativeButton={false}
        render={
          <SidebarMenuSubButton className="cursor-pointer">
            Theme: {theme}
          </SidebarMenuSubButton>
        }
      />
      <DropdownMenuContent>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
