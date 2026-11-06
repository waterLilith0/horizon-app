import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useCurrentUser } from "@/dashboard/features/auth/auth";

// Which account the library is synced with, and whether that happens by
// itself. Until a choice was made there is no value.
const syncSettingsAtom = atomWithStorage<{
  userId: number;
  auto: boolean;
} | null>("horizon-sync", null, undefined, { getOnInit: true });

export function useSyncSettings() {
  const { data: user } = useCurrentUser();
  const [settings, setSettings] = useAtom(syncSettingsAtom);
  const userId = user ? Number(user.userId) : undefined;

  return {
    userId,
    // What was chosen before, even for another account.
    settings,
    // What was chosen for the account that is logged in now.
    linked: settings?.userId === userId ? settings : null,
    setSettings,
  };
}
