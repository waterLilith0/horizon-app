import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { postApiAuthLogin } from "@/api/generated/internal/horizonInternal";
import { useAppForm } from "@/components/form";
import { currentUserQueryKey } from "./auth";
import { loginSchema } from "./auth.schema";

export default function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [error, setError] = useState<string>();
  const queryClient = useQueryClient();

  const form = useAppForm({
    defaultValues: { userName: "", password: "" },
    validators: {
      onChange: loginSchema,
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setError(undefined);
      const response = await postApiAuthLogin(loginSchema.parse(value));

      const status: number = response.status;
      if (status !== 200) {
        setError(response.data.detail ?? response.data.title ?? "Login failed");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      onLoggedIn();
    },
  });

  return (
    <form.AppForm>
      <form.AuthForm submit="Log in" pending="Logging in…" error={error}>
        <form.AppField name="userName">
          {(field) => (
            <field.TextField
              label="Username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
            />
          )}
        </form.AppField>
        <form.AppField name="password">
          {(field) => (
            <field.PasswordField
              label="Password"
              autoComplete="current-password"
            />
          )}
        </form.AppField>
      </form.AuthForm>
    </form.AppForm>
  );
}
