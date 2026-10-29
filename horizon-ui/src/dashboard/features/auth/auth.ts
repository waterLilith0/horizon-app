import type {
  LoginData,
  RegisterData,
} from "@/dashboard/features/auth/auth.schema";
import { useMutation } from "@tanstack/react-query";

type FieldErrors = Partial<Record<keyof RegisterData, { message: string }>>;
export type AuthResult = { ok: true } | { ok: false; fieldErrors: FieldErrors };

type ValidationProblem = { errors?: Record<string, string[]> };

function toFieldErrors(problem: ValidationProblem): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const [key, messages] of Object.entries(problem.errors ?? {})) {
    const field = (key.charAt(0).toLowerCase() +
      key.slice(1)) as keyof RegisterData;
    fieldErrors[field] = { message: messages[0] };
  }
  return fieldErrors;
}

export async function isUsernameAvailable(
  username: string,
  signal?: AbortSignal,
) {
  const res = await fetch(
    `/api/auth/username-available?username=${encodeURIComponent(username)}`,
    { signal },
  );
  if (!res.ok) throw new Error(`Username check failed: ${res.status}`);
  const body: { available: boolean } = await res.json();
  return body.available;
}

export async function register(data: RegisterData): Promise<AuthResult> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (res.ok) return { ok: true };
  if (res.status === 400 || res.status === 409) {
    return { ok: false, fieldErrors: toFieldErrors(await res.json()) };
  }
  throw new Error(`Registration failed: ${res.status}`);
}

export async function login(login: LoginData): Promise<{ ok: boolean }> {
  const loginMutations = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: login.identifier,
          password: login.password,
        }),
      });
    },
  });

  if (loginMutations.isPending) return { ok: true };
  if (loginMutations.error) return { ok: false };
  return { ok: true };
}

export type User = { username: string; email: string };

export async function getCurrentUser(): Promise<User | null> {
  const res = await fetch("/api/auth/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Loading user failed: ${res.status}`);
  return res.json();
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
}
