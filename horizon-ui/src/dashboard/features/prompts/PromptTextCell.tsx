import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useValidatedInput } from "@/shared/useValidatedInput";
import { PromptTextSchema } from "./prompt.schema";

export default function PromptTextCell({
  id,
  value,
  onSave,
}: {
  id: string;
  value: string;
  onSave: (id: string, text: string) => void;
}) {
  const draft = useValidatedInput(PromptTextSchema, value);
  const [isEditing, setIsEditing] = useState(false);
  const inputId = `prompt-text-${id}`;

  function startEditing() {
    draft.reset(value);
    setIsEditing(true);
  }

  function save() {
    const valid = draft.validate();
    if (valid === undefined) return;
    if (valid !== value) onSave(id, valid);
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
            autoFocus
            id={inputId}
            value={draft.value}
            onChange={(event) => draft.change(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setIsEditing(false);
            }}
            aria-invalid={Boolean(draft.error)}
            aria-describedby={draft.error ? `${inputId}-error` : undefined}
          />
          {draft.error && (
            <p id={`${inputId}-error`} role="alert">
              {draft.error}
            </p>
          )}
        </>
      ) : (
        <button type="button" className="text-left" onClick={startEditing}>
          {value}
        </button>
      )}
    </form>
  );
}
