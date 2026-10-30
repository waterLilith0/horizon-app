import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { postApiAuthLogin } from "@/api/generated/internal/horizonInternal";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form";
import { currentUserQueryKey } from "./auth";
import { loginSchema } from "./auth.schema";

export default function LoginForm({
  onLoggedIn,
}: {
  onLoggedIn: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: { identifier: "", password: "" },
    validators: {
      onChange: loginSchema,
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setError(undefined);
      const { identifier, password } = loginSchema.parse(value);
      const response = await postApiAuthLogin({
        userName: identifier,
        password,
      });

      const status: number = response.status;
      if (status !== 200) {
        setError(
          response.data.detail ?? response.data.title ?? "Login failed",
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      onLoggedIn();
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
        <form.Field name="identifier">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Username or email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
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

        <form.Field name="password">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id={field.name}
                    name={field.name}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </Button>
                </div>
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
              {isSubmitting ? "Logging in…" : "Log in"}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
