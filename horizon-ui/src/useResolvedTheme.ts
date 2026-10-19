import { useSyncExternalStore } from "react";
import { useAtomValue } from "jotai";
import { themeAtom } from "@/configAtoms";

const query = "(prefers-color-scheme: dark)";

function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

const getSystemDark = () => window.matchMedia(query).matches;

// Resolves "system" to "light" or "dark" and follows OS changes live.
export function useResolvedTheme(): "light" | "dark" {
  const theme = useAtomValue(themeAtom);
  const systemDark = useSyncExternalStore(subscribe, getSystemDark);
  if (theme === "system") return systemDark ? "dark" : "light";
  return theme === "dark" ? "dark" : "light";
}
