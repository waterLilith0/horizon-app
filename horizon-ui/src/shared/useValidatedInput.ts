import { useState } from "react";
import type z from "zod";

// A text input that is checked against a schema when it is submitted. Its
// error goes away as soon as the text changes.
export function useValidatedInput<T>(schema: z.ZodType<T>, initial = "") {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");

  return {
    value,
    error,
    change: (next: string) => {
      setValue(next);
      setError("");
    },
    reset: (next = "") => {
      setValue(next);
      setError("");
    },
    // The valid value, or nothing after showing what is wrong with it.
    validate(): T | undefined {
      const result = schema.safeParse(value);
      if (result.success) return result.data;
      setError(result.error.issues[0]?.message ?? "Invalid value");
    },
  };
}
