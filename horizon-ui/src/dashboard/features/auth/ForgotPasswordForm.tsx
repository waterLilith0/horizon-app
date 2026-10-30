import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { postApiAuthForgotPassword } from "@/api/generated/internal/horizonInternal";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema } from "./auth.schema";

export default function ForgotPasswordForm({
  onSent,
}: {
  onSent: () => void;
}) {
  const [error, setError] = useState<string>();

  const form = useForm({
    defaultValues: { email: "" },
    validators: {
      onChange: forgotPasswordSchema,
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setError(undefined);
      const res = await postApiAuthForgotPassword({
        email: value.email,
      });

      if (res.status === 204) {
        onSent();
        return;
      }

      const errorMsg =
        (res.data as any).detail ??
        (res.data as any).title ??
        "Failed to send reset email";
      setError(errorMsg);
    },
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="email">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email address</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        {error && (
          <Field data-invalid>
            <FieldError errors={[{ message: error }]} />
          </Field>
        )}

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send Reset Link"}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
