import { useState } from "react";
import { postApiAuthForgotPassword } from "@/api/generated/internal/horizonInternal";
import { problemOf } from "@/api/http";
import { useAppForm } from "@/components/form";
import { forgotPasswordSchema } from "./auth.schema";

export default function ForgotPasswordForm({ onSent }: { onSent: () => void }) {
  const [error, setError] = useState<string>();

  const form = useAppForm({
    defaultValues: { email: "" },
    validators: {
      onChange: forgotPasswordSchema,
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      const message = problemOf(
        await postApiAuthForgotPassword({ email: value.email }),
        "Failed to send reset email",
      );
      setError(message);
      if (!message) onSent();
    },
  });

  return (
    <form.AppForm>
      <form.AuthForm submit="Send Reset Link" pending="Sending…" error={error}>
        <form.AppField name="email">
          {(field) => (
            <field.TextField
              label="Email address"
              type="email"
              inputMode="email"
              autoComplete="email"
            />
          )}
        </form.AppField>
      </form.AuthForm>
    </form.AppForm>
  );
}
