import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function LoginRegisterDialog({
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
          <FieldLegend>Login / Register</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                type="username"
                autoComplete="on"
                placeholder="coolCat"
              />
              <FieldDescription>Please enter a username</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Username</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="password"
                aria-invalid
              />
              <FieldError>Please enter password</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="this@gmail.com"
                autoComplete="email"
                aria-invalid
              />
            </Field>
          </FieldGroup>
          <Button>Log In</Button>
          <Button>Register</Button>
          <a
            href=""
            className="underline hover:bg-accent self-center w-fit p-2"
          >
            forgot password
          </a>
        </FieldSet>
      </DialogContent>
    </Dialog>
  );
}
