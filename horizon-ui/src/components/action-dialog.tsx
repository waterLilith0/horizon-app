import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ActionDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  // Closing it any way other than through an action.
  onClose: () => void;
  // The buttons to choose from.
  children: ReactNode;
}

export function ActionDialog({
  open,
  title,
  description,
  onClose,
  children,
}: ActionDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>{children}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteDialogProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
}: DeleteDialogProps) {
  return (
    <ActionDialog
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
    >
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={onConfirm}>
        Delete
      </Button>
    </ActionDialog>
  );
}
