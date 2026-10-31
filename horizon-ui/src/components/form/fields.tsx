import { useState, type ComponentProps, type ReactNode } from "react";
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
import { useFieldContext, useFormContext } from "./context";

const STRENGTH_LABELS = ["Very weak", "Weak", "Okay", "Strong", "Very strong"];

type InputProps = Omit<ComponentProps<typeof Input>, "id" | "name" | "value">;

// What every field shows around its input: label, error, and what is going on.
function FieldFrame({
  label,
  pendingText,
  children,
}: {
  label: string;
  pendingText?: string;
  children: ReactNode;
}) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      {children}
      {pendingText && field.state.meta.isValidating && (
        <FieldDescription>{pendingText}</FieldDescription>
      )}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

function useInputProps() {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return {
    id: field.name,
    name: field.name,
    value: field.state.value,
    onBlur: field.handleBlur,
    onChange: (e: { target: { value: string } }) =>
      field.handleChange(e.target.value),
    "aria-invalid": isInvalid,
  };
}

export function TextField({
  label,
  pendingText,
  ...inputProps
}: InputProps & { label: string; pendingText?: string }) {
  const props = useInputProps();

  return (
    <FieldFrame label={label} pendingText={pendingText}>
      <Input {...props} {...inputProps} />
    </FieldFrame>
  );
}

// With strength hints, it also rates the password as it is typed.
export function PasswordField({
  label,
  strengthHints,
  ...inputProps
}: InputProps & { label: string; strengthHints?: string[] }) {
  const field = useFieldContext<string>();
  const props = useInputProps();
  const [showPassword, setShowPassword] = useState(false);
  const strength =
    strengthHints && field.state.value
      ? zxcvbn(field.state.value, strengthHints)
      : null;

  return (
    <FieldFrame label={label}>
      <div className="flex gap-2">
        <Input
          {...props}
          {...inputProps}
          type={showPassword ? "text" : "password"}
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
      {strength && (
        <>
          <Progress value={(strength.score / 4) * 100} />
          <FieldDescription>
            {STRENGTH_LABELS[strength.score]}
            {strength.feedback.warning && ` – ${strength.feedback.warning}`}
          </FieldDescription>
        </>
      )}
    </FieldFrame>
  );
}

// The form around the fields, with the submit button and what went wrong.
export function AuthForm({
  submit,
  pending,
  error,
  children,
}: {
  submit: string;
  pending: string;
  error?: string;
  children?: ReactNode;
}) {
  const form = useFormContext();

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
        {children}
        {error && (
          <Field data-invalid>
            <FieldError errors={[{ message: error }]} />
          </Field>
        )}
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? pending : submit}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
