import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { zxcvbn } from "zxcvbn-ts";
import { postApiAuthResetPassword } from "@/api/generated/internal/horizonInternal";
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
import { resetPasswordSchema } from "./auth.schema";

const STRENGTH_LABELS = ["Very weak", "Weak", "Okay", "Strong", "Very strong"];

export default function ResetPasswordForm({
  token,
  onReset,
}: {
  token: string;
  onReset: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();

  const form = useForm({
    defaultValues: { newPassword: "" },
    validators: {
      onChange: resetPasswordSchema,
      onSubmit: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setError(undefined);
      const res = await postApiAuthResetPassword({
        token,
        newPassword: value.newPassword,
      });

      if (res.status === 204) {
        onReset();
        return;
      }

      const errorMsg =
        (res.data as any).detail ??
        (res.data as any).title ??
        "Reset failed";
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
        <form.Field name="newPassword">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            const strength = field.state.value
              ? zxcvbn(field.state.value)
              : null;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>New Password</FieldLabel>
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

        {error && (
          <Field data-invalid>
            <FieldError errors={[{ message: error }]} />
          </Field>
        )}

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Resetting…" : "Reset Password"}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
