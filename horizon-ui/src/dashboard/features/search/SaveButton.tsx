import { useState } from "react";
import { RiBookmarkLine, RiCheckLine } from "@remixicon/react";
import { ActionButton } from "@/components/action-button";
import { useServerAction } from "@/shared/useServerAction";

interface SaveButtonProps {
  label: string;
  onSave: () => void | Promise<void>;
}

// Copies the item into the user's library, once.
export default function SaveButton({ label, onSave }: SaveButtonProps) {
  const [saved, setSaved] = useState(false);
  const { pending, error, run } = useServerAction(async () => {
    await onSave();
    setSaved(true);
  });

  return (
    <ActionButton
      label={saved ? "Saved to your library" : label}
      icon={saved ? <RiCheckLine /> : <RiBookmarkLine />}
      pending={pending}
      error={error}
      disabled={saved}
      onClick={run}
    />
  );
}
