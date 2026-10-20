import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { zxcvbn } from "zxcvbn-ts";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { registerSchema, usernameSchema } from "@/validationSchema";

const STRENGTH_LABELS = ["Very weak", "Weak", "Okay", "Strong", "Very strong"];

export default function RegisterForm({
  onRegistered,
}: {
  onRegistered: (email: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    defaultValues: { username: "", email: "", password: "" },
    validators: {
      onChange: registerSchema,
      onSubmit: registerSchema,
      onSubmitAsync: async ({ value }) => {
        const result = await register(registerSchema.parse(value));
        return result.ok ? undefined : { fields: result.fieldErrors };
      },
    },
    onSubmit: ({ value }) => onRegistered(value.email),
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
        <form.Field
          name="username"
          validators={{
            onChangeAsyncDebounceMs: 400,
            onChangeAsync: async ({ value, signal }) => {
              if (!usernameSchema.safeParse(value).success) return undefined;
              return (await isUsernameAvailable(value, signal))
                ? undefined
                : { message: "That username is taken" };
            },
          }}
        >
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Username</FieldLabel>
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
                {field.state.meta.isValidating && (
                  <FieldDescription>Checking…</FieldDescription>
                )}
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="email">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
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

        <form.Field name="password">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            const strength = field.state.value
              ? zxcvbn(field.state.value, [
                  form.getFieldValue("username"),
                  form.getFieldValue("email"),
                ])
              : null;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id={field.name}
                    name={field.name}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
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
                {strength && (
                  <>
                    <Progress value={(strength.score / 4) * 100} />
                    <FieldDescription>
                      {STRENGTH_LABELS[strength.score]}
                      {strength.feedback.warning &&
                        ` – ${strength.feedback.warning}`}
                    </FieldDescription>
                  </>
                )}
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
