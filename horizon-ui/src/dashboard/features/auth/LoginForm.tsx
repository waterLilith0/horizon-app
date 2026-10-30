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
import { currentUserQueryKey } from "./auth";

export default function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const queryClient = useQueryClient();
  const { mutateAsync: login, isPending } = usePostApiAuthLogin();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();

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

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
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
      </FieldGroup>
    </form>
  );
}
