import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

export default function AccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="password"
                aria-invalid
              />
              <Input
                id="username"
                type="username"
                autoComplete="on"
                placeholder="coolCat"
              />
              <FieldError>Please enter password</FieldError>
            </Field>
          </FieldGroup>
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
      </DialogContent>
    </Dialog>
  );
}
