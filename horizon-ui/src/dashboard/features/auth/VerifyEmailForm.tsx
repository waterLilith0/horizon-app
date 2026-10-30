import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { postApiAuthVerifyEmail } from "@/api/generated/internal/horizonInternal";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";

export default function VerifyEmailForm({
  token,
  onVerified,
}: {
  token: string;
  onVerified: () => void;
}) {
  const [error, setError] = useState<string>();

  const form = useForm({
    defaultValues: {},
    onSubmit: async () => {
      setError(undefined);
      const res = await postApiAuthVerifyEmail({ token });

      // Orval always returns { data, status, headers }
      // Success is 204 No Content
      if (res.status === 204) {
        onVerified();
        return;
      }

      // Error case
      const errorMsg =
        (res.data as any).detail ??
        (res.data as any).title ??
        "Verification failed";
      setError(errorMsg);
    },
  });

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
        <p className="text-sm text-muted-foreground mb-4">
          Verifying your email address...
        </p>

        {error && (
          <Field data-invalid>
            <FieldError errors={[{ message: error }]} />
          </Field>
        )}

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Verifying…" : "Verify Email"}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
