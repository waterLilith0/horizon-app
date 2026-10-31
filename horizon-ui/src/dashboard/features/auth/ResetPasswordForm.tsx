import { useState } from "react";
import { postApiAuthResetPassword } from "@/api/generated/internal/horizonInternal";
import { problemOf } from "@/api/http";
import { useAppForm } from "@/components/form";
import { resetPasswordSchema } from "./auth.schema";

export default function ResetPasswordForm({
  token,
  onReset,
}: {
  token: string;
  onReset: () => void;
}) {
  const [error, setError] = useState<string>();

  const form = useAppForm({
    defaultValues: { newPassword: "" },
    validators: {
      onChange: resetPasswordSchema,
      onSubmit: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      const message = problemOf(
        await postApiAuthResetPassword({
          token,
          newPassword: value.newPassword,
        }),
        "Reset failed",
      );
      setError(message);
      if (!message) onReset();
    },
  });

  return (
    <form.AppForm>
      <form.AuthForm submit="Reset Password" pending="Resetting…" error={error}>
        <form.AppField name="newPassword">
          {(field) => (
            <field.PasswordField
              label="New Password"
              autoComplete="new-password"
              strengthHints={[]}
            />
          )}
        </form.AppField>
      </form.AuthForm>
    </form.AppForm>
  );
}
