import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { PromptTextSchema } from "./prompt.schema";

export default function PromptTextCell({
  id,
  value,
  onSave,
}: {
  id: number;
  value: string;
  onSave: (id: number, text: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `prompt-text-${id}`;

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [isEditing, value]);

  function save() {
    const result = PromptTextSchema.safeParse(draft);

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid prompt text");
      return;
    }

    if (result.data !== value) onSave(id, result.data);
    setError("");
    setIsEditing(false);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      {isEditing ? (
        <>
          <Input
            ref={inputRef}
            id={inputId}
            value={draft}
            onChange={(event) => {
              setDraft(event.currentTarget.value);
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setDraft(value);
                setError("");
                setIsEditing(false);
              }
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
          />
          {error && (
            <p id={`${inputId}-error`} role="alert">
              {error}
            </p>
          )}
        </>
      ) : (
        <button
          type="button"
          className="text-left"
          onClick={() => {
            setDraft(value);
            setIsEditing(true);
          }}
        >
          {value}
        </button>
      )}
    </form>
  );
}
