import { useEffect, useSyncExternalStore } from "react";
import { useAtomValue } from "jotai";
import { themeAtom } from "@/shared/theme/configAtoms";
import z from "zod";

const query = "(prefers-color-scheme: dark)";

function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

const getSystemDark = () => window.matchMedia(query).matches;

// Resolves "system" to "light" or "dark" and follows OS changes live.
function useResolvedTheme(): "light" | "dark" {
  const theme = useAtomValue(themeAtom);
  const systemDark = useSyncExternalStore(subscribe, getSystemDark);
  if (theme === "system") return systemDark ? "dark" : "light";
  return theme === "dark" ? "dark" : "light";
}

export function useApplyTheme() {
  const theme = useResolvedTheme();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
}

export const THEMES = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
] as const;

export const themeSchema = z.enum(["system", "light", "dark"]);
