import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePostApiAuthLogin } from "@/api/generated/internal/horizonInternal";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/dashboard/features/auth/auth.schema";
import { currentUserQueryKey } from "@/dashboard/features/auth/use-current-user";

const schema = loginSchema.pick({ identifier: true, password: true });
type Errors = Partial<Record<"identifier" | "password", string>>;

function TextField({
  id,
  label,
  error,
  ...inputProps
}: { label: string; error?: string } & React.ComponentProps<typeof Input>) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} name={id} aria-invalid={!!error} {...inputProps} />
      {error && <FieldError errors={[{ message: error }]} />}
    </Field>
  );
}

export default function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = usePostApiAuthLogin();
  const [values, setValues] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);

  const bind = (key: keyof typeof values) => ({
    id: key,
    value: values[key],
    error: errors[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const { path, message } of parsed.error.issues) {
        next[path[0] as keyof Errors] ??= message;
      }
      return setErrors(next);
    }

    const res = await mutateAsync({
      data: {
        userName: parsed.data.identifier,
        password: parsed.data.password,
      },
    });
    if (res.status !== 200) {
      return setErrors({
        password: res.data.detail ?? res.data.title ?? "Login failed",
      });
    }

    setErrors({});
    await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    onLoggedIn();
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <FieldGroup>
        <TextField
          {...bind("identifier")}
          label="Username or email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
        />
        <TextField
          {...bind("password")}
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowPassword((s) => !s)}
          aria-pressed={showPassword}
        >
          {showPassword ? "Hide" : "Show"} password
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Logging in…" : "Log in"}
        </Button>
      </FieldGroup>
    </form>
  );
}
