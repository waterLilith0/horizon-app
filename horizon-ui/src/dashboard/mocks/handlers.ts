import { delay, http, HttpResponse } from "msw";

// Simulates the server's session cookie so a login survives page reloads.
// Mock only: the real backend uses an HttpOnly cookie.
const SESSION_KEY = "msw-session-user";

export const handlers = [
  http.get("/api/auth/username-available", async ({ request }) => {
    await delay(300);
    const username =
      new URL(request.url).searchParams.get("username")?.toLowerCase() ?? "";
    return HttpResponse.json({
      available: !["coolcat", "taken"].includes(username),
    });
  }),

  http.post("/api/auth/register", async ({ request }) => {
    await delay(600);
    const body = (await request.json()) as { username: string };
    if (body.username === "taken") {
      return HttpResponse.json(
        {
          title: "Conflict",
          status: 409,
          errors: { username: ["That username is taken"] },
        },
        { status: 409 },
      );
    }
    return new HttpResponse(null, { status: 201 });
  }),

  http.post("/api/auth/login", async ({ request }) => {
    await delay(600);
    const body = (await request.json()) as {
      identifier: string;
      password: string;
      rememberMe: boolean;
    };
    if (body.password === "wrong") {
      return new HttpResponse(null, { status: 401 });
    }
    const storage = body.rememberMe ? localStorage : sessionStorage;
    storage.setItem(SESSION_KEY, body.identifier);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("/api/auth/me", async () => {
    await delay(200);
    const identifier =
      localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    if (!identifier) {
      return new HttpResponse(null, { status: 401 });
    }
    const username = identifier.split("@")[0];
    return HttpResponse.json({ username, email: `${username}@example.com` });
  }),

  http.post("/api/auth/logout", () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    return new HttpResponse(null, { status: 204 });
  }),
];
