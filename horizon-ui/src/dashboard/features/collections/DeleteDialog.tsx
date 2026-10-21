import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CollectionValues } from "./collection.schema";

type DeleteDialogProps = {
  pendingDelete: CollectionValues | null;
  setPendingDelete: (value: CollectionValues | null) => void;
  confirmDelete: () => void;
};

export function DeleteDialog({
  pendingDelete,
  setPendingDelete,
  confirmDelete,
}: DeleteDialogProps) {
  return (
    <Dialog
      open={pendingDelete !== null}
      onOpenChange={(open) => {
        if (!open) setPendingDelete(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete collection?</DialogTitle>
          <DialogDescription>
            “{pendingDelete?.name}” and all of its prompts will be removed. This
            can't be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
