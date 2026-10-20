import type { LoginData, RegisterData } from "@/validationSchema";

export type FieldErrors = Partial<
  Record<keyof RegisterData, { message: string }>
>;
export type AuthResult = { ok: true } | { ok: false; fieldErrors: FieldErrors };

// ASP.NET returns validation errors as ProblemDetails: { errors: { Username: ["..."] } }
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

export async function login(data: LoginData): Promise<{ ok: boolean }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (res.ok) return { ok: true };
  if (res.status === 401) return { ok: false };
  throw new Error(`Login failed: ${res.status}`);
}
