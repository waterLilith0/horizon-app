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
import { currentUserQueryKey } from "./auth";
import { useQueryClient } from "@tanstack/react-query";
import { currentUserQueryKey } from "@/dashboard/features/auth/use-current-user";
import { Checkbox } from "@/components/ui/checkbox";

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
  const queryClient = useQueryClient();
  const { mutateAsync: login, isPending } = usePostApiAuthLogin();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);

export default function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = usePostApiAuthLogin();
  const [values, setValues] = useState({ identifier: "", password: "" });
  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await login({ data: { userName: identifier, password } });
    if (res.status !== 200) {
      return setError(res.data.detail ?? res.data.title ?? "Login failed");
    }
    setError(undefined);
    await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    onLoggedIn();
  }
      onLoggedIn();
    },
    <form onSubmit={handleSubmit}>

        <Field>
          <FieldLabel htmlFor="identifier">Username or email</FieldLabel>
          <Input
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
          />
        </Field>
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-invalid={!!error}
          />
          {error && <FieldError errors={[{ message: error }]} />}
        </Field>
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

        <form.Field name="rememberMe">
          {(field) => (
            <Field orientation="horizontal">
              <Checkbox
                id={field.name}
                checked={field.state.value}
                onCheckedChange={(checked) =>
                  field.handleChange(checked === true)
                }
              />
              <FieldLabel htmlFor={field.name}>Remember me</FieldLabel>
            </Field>
          )}
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
