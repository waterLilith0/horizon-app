import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form";
import { changePasswordSchema } from "../auth/validationSchema";

export default function PasswordChange() {
  const passwordForm = useForm({
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

  // TODO: implement
  async function changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    console.log(currentPassword, newPassword);
    return true;
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        passwordForm.handleSubmit();
      }}
    >
      <FieldGroup>
        <passwordForm.Field name="currentPassword">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Current Password</FieldLabel>
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
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </passwordForm.Field>

        <passwordForm.Field name="newPassword">
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
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </passwordForm.Field>

        <passwordForm.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Saving..." : "Change Password"}
            </Button>
          )}
        </passwordForm.Subscribe>
      </FieldGroup>
    </form>
  );
}
