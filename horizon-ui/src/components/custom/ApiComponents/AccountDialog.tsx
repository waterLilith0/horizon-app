import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { changePasswordSchema } from "@/validationSchema";
import { useForm } from "@tanstack/react-form";

export default function AccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [email, setEmail] = useState("");
  const [apiKeys, setApiKeys] = useState("");

  const PasswordForm = useForm({
    defaultValues: { currentPassword: "", newPassword: "" },
    validators: {
      onChangeAsync: changePasswordSchema,
      onChangeAsyncDebounceMs: 400,
      onSubmit: changePasswordSchema,
      onSubmitAsync: async ({ value }) => {
        const ok = await changePassword(
          value.currentPassword,
          value.newPassword,
        );
        if (!ok) {
          return {
            fields: {
              currentPassword: { message: "Current password is incorrect" },
            },
          };
        }
        return undefined;
      },
    },
    onSubmit: async ({ formApi }) => {
      formApi.reset();
    },
  });

  async function changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    console.log(currentPassword, newPassword);
    return true;
  }

  function handleDeleteAccount() {
    setIsDeleting(true);
  }

  function handleConfirmDeletion() {
    console.log("Confirm Deletion clicked");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <FieldSet>
          <FieldLegend>Profile</FieldLegend>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>
                  <FieldLabel htmlFor="name">Username</FieldLabel>
                </TableCell>
                <TableCell>
                  <FieldContent>coolestCat</FieldContent>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <FieldLabel htmlFor="username">Email</FieldLabel>
                </TableCell>
                <TableCell>
                  <FieldContent>coolesCat@meow.com</FieldContent>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </FieldSet>
        <FieldSeparator>Settings</FieldSeparator>
        <FieldSet>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              PasswordForm.handleSubmit();
            }}
          >
            <FieldGroup>
              <PasswordForm.Field name="currentPassword">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Current Password
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        placeholder="*********"
                        autoComplete="current-password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </PasswordForm.Field>

              <PasswordForm.Field name="newPassword">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>New Password</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        placeholder="*********"
                        autoComplete="new-password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </PasswordForm.Field>

              <PasswordForm.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? "Saving..." : "Change Password"}
                  </Button>
                )}
              </PasswordForm.Subscribe>
            </FieldGroup>
          </form>
          <FieldGroup>
            <FieldLegend>API Access</FieldLegend>
            <Field orientation={"horizontal"}>
              <FieldLabel>Active API Keys</FieldLabel>
              <FieldContent>{1}</FieldContent>
            </Field>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>ab89...</TableCell>
                  <TableCell>
                    <Button>Deactivate</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell rowSpan={2}>
                    <Button>Generate New API Key</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </FieldGroup>
        </FieldSet>
        <FieldSeparator>Account Actions</FieldSeparator>
        <FieldSet>
          <FieldLegend>Account Actions</FieldLegend>
          <Button variant="outline" onClick={handleDeleteAccount}>
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
