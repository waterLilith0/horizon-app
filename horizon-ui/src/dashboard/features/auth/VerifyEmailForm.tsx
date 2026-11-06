import { useState } from "react";
import { postApiAuthVerifyEmail } from "@/api/generated/internal/horizonInternal";
import { problemOf } from "@/api/http";
import { useAppForm } from "@/components/form";

export default function VerifyEmailForm({
  token,
  onVerified,
}: {
  token: string;
  onVerified: () => void;
}) {
  const [error, setError] = useState<string>();

  const form = useAppForm({
    defaultValues: {},
    onSubmit: async () => {
      const message = problemOf(
        await postApiAuthVerifyEmail({ token }),
        "Verification failed",
      );
      setError(message);
      if (!message) onVerified();
    },
  });

  return (
    <form.AppForm>
      <form.AuthForm submit="Verify Email" pending="Verifying…" error={error}>
        <p className="text-sm text-muted-foreground mb-4">
          Verifying your email address...
        </p>
      </form.AuthForm>
    </form.AppForm>
  );
}
