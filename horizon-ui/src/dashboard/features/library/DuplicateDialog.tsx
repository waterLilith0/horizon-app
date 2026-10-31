import { ActionDialog } from "@/components/action-dialog";
import { Button } from "@/components/ui/button";
import { describeCounts } from "@/shared/format";
import type { DuplicateCounts } from "./useLibraryImport";

interface DuplicateDialogProps {
  duplicates: DuplicateCounts | null;
  onSkip: () => void;
  onKeepBoth: () => void;
  onCancel: () => void;
}

export default function DuplicateDialog({
  duplicates,
  onSkip,
  onKeepBoth,
  onCancel,
}: DuplicateDialogProps) {
  return (
    <ActionDialog
      open={duplicates !== null}
      title="Already in your library"
      description={`This file contains ${duplicates ? describeCounts(duplicates) : ""} you already have. Skipping leaves those out${duplicates?.collections ? ", along with the prompts of a skipped collection" : ""}.`}
      onClose={onCancel}
    >
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="outline" onClick={onSkip}>
        Skip duplicates
      </Button>
      <Button onClick={onKeepBoth}>Import anyway</Button>
    </ActionDialog>
  );
}
