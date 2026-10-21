import { useAtom } from "jotai";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { themeAtom } from "@/shared/theme/configAtoms";
import { THEMES, themeSchema } from "@/shared/theme/useResolvedTheme";

export default function ThemeMenu({ className }: { className?: string }) {
  const [theme, setTheme] = useAtom(themeAtom);

  return (
    <Select value={theme} onValueChange={(v) => setTheme(themeSchema.parse(v))}>
      <SelectTrigger
        aria-label="Theme"
        className={cn(
          "h-8 w-full border-transparent bg-transparent text-sm hover:bg-gray-500 lg:w-32",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="z-60">
        {THEMES.map((t) => (
          <SelectItem key={t.value} value={t.value}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
