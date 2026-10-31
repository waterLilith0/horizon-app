import { useAtomValue, useSetAtom } from "jotai";
import { RiRefreshLine } from "@remixicon/react";
import { ActionButton } from "@/components/action-button";
import { libraryAtom } from "../library/library.store";
import SyncConsentDialog from "./SyncConsentDialog";
import { detachFromServer } from "./sync.state";
import { useSyncSettings } from "./sync.settings";
import { useLibrarySync } from "./useLibrarySync";

// Everything about syncing that the user sees. It only exists when logged in,
// and only syncs once the user has agreed to it for that account.
export default function SyncControls() {
  const { userId, settings, linked, setSettings } = useSyncSettings();
  const library = useAtomValue(libraryAtom);
  const setLibrary = useSetAtom(libraryAtom);
  const { changes, running, error, sync } = useLibrarySync(
    linked?.auto === true,
  );

  if (userId === undefined) return null;

  // A library that was synced with another account has no use for its ids.
  const choose = (auto: boolean) => {
    if (settings !== null) setLibrary(detachFromServer);
    setSettings({ userId, auto });
  };

  return (
    <>
      {linked && (
        <ActionButton
          label="Sync"
          text={running ? "Syncing…" : changes ? `Sync (${changes})` : "Synced"}
          icon={<RiRefreshLine />}
          pending={running}
          error={error}
          disabled={changes === 0}
          onClick={sync}
        />
      )}
      <SyncConsentDialog
        open={!linked}
        otherAccount={settings !== null}
        counts={{
          collections: library.collections.length,
          prompts: library.prompts.length,
        }}
        onChoose={choose}
      />
    </>
  );
}
