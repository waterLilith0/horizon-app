import { useState } from "react";
import { ApiError } from "@/api/http";

function describeError(e: unknown): string {
  if (e instanceof ApiError && e.status === 401) {
    return "Log in again to continue.";
  }
  return e instanceof Error ? e.message : "Something went wrong.";
}

// Runs an action against the server and keeps track of it for the button that
// started it: whether it is under way, and why it failed. Running resolves to
// whether the action succeeded.
export function useServerAction(action: () => Promise<void>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function run() {
    setPending(true);
    setError(undefined);
    try {
      await action();
      return true;
    } catch (e) {
      setError(describeError(e));
      return false;
    } finally {
      setPending(false);
    }
  }

  return { pending, error, run };
}
