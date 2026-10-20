import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/validationSchema";

export default function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    defaultValues: { identifier: "", password: "" },
    validators: {
      onSubmit: loginSchema,
      onSubmitAsync: async ({ value }) => {
        const result = await login(loginSchema.parse(value));
        return result.ok
          ? undefined
          : {
              fields: {
                password: { message: "Incorrect username/email or password" },
              },
            };
      },
    },
    onSubmit: () => onLoggedIn(),
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
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
                    onClick={() => setShowPassword((s) => !s)}
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

        <form.Subscribe selector={(s) => s.isSubmitting}>
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
