import { ActionDialog } from "@/components/action-dialog";
import { Button } from "@/components/ui/button";
import { describeCounts } from "@/shared/format";

interface SyncConsentDialogProps {
  open: boolean;
  // The library was last synced with a different account.
  otherAccount: boolean;
  counts: { collections: number; prompts: number };
  onChoose: (auto: boolean) => void;
}

// Nothing leaves the browser before the user has agreed to this.
export default function SyncConsentDialog({
  open,
  otherAccount,
  counts,
  onChoose,
}: SyncConsentDialogProps) {
  const existing = describeCounts(counts);

  return (
    <ActionDialog
      open={open}
      title="Sync your library with your account?"
      description={[
        "Everything you create is uploaded to your account as private. Only what you publish is visible to others.",
        existing && `Your ${existing} will be uploaded.`,
        otherAccount &&
          "This library was synced with a different account, so its link to that account is dropped first.",
        "Not now keeps everything local. You can still sync by hand, or turn auto sync on later.",
      ]
        .filter(Boolean)
        .join(" ")}
      onClose={() => onChoose(false)}
    >
      <Button variant="outline" onClick={() => onChoose(false)}>
        Not now
      </Button>
      <Button onClick={() => onChoose(true)}>Turn on auto sync</Button>
    </ActionDialog>
  );
}
