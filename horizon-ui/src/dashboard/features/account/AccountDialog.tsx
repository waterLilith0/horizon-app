import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import {
  FieldContent,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "../auth/auth";
import AutoSyncSetting from "../sync/AutoSyncSetting";

export default function AccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const user = useCurrentUser();
  const [isDeleting, setIsDeleting] = useState(false);

  function handleDeleteAccount() {
    setIsDeleting(true);
  }

  function handleConfirmDeletion() {}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <FieldSet>
          <FieldLegend>Profile</FieldLegend>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>
                  <FieldLabel>Username</FieldLabel>
                </TableCell>
                <TableCell>
                  <FieldContent>{user.data?.userName}</FieldContent>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <FieldLabel>Email</FieldLabel>
                </TableCell>
                <TableCell>
                  <FieldContent>{user.data?.email}</FieldContent>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </FieldSet>
        <FieldSeparator>Settings</FieldSeparator>
        <FieldSet>
          <AutoSyncSetting />
        </FieldSet>
        {/* <FieldSet>
          <PasswordChange />
          <ApiAccess />
        </FieldSet> */}
        <FieldSeparator>Account Actions</FieldSeparator>
        <FieldSet>
          <FieldLegend>Account Actions</FieldLegend>
          <Button variant={"outline"} onClick={handleDeleteAccount}>
            Delete Account
          </Button>
          {isDeleting && (
            <Button variant="destructive" onClick={handleConfirmDeletion}>
              Confirm Deletion
            </Button>
          )}
          <FieldContent>
            Deleting your account is permanent and cannot be undone. Some
            non-identifiable information such as logs and usage statistics may
            still be retained for analytical purposes for up to 14 days after
            deletion.
          </FieldContent>
        </FieldSet>
      </DialogContent>
    </Dialog>
  );
}
