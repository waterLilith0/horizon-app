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

type DeleteProps = {
  collection: CollectionValues | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DeleteDialog({
  collection,
  onConfirm,
  onCancel,
}: DeleteProps) {
  return (
    <Dialog
      open={collection !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete collection?</DialogTitle>
          <DialogDescription>
            “{collection?.name}” and all of its prompts will be removed. This
            can't be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
