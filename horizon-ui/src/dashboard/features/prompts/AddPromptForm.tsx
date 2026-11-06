import { useState, type SyntheticEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RiAddLine } from "@remixicon/react";
import { FIELD_MAX } from "@/api/limits";
import { useValidatedInput } from "@/shared/useValidatedInput";
import { PROMPT_TYPES, PromptTextSchema } from "./prompt.schema";

export default function AddPromptForm({
  onAdd,
}: {
  onAdd: (promptText: string, type: string) => void;
}) {
  const text = useValidatedInput(PromptTextSchema);
  const [type, setType] = useState<string>(PROMPT_TYPES[0]);

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const valid = text.validate();
    if (valid === undefined) return;
    onAdd(valid, type);
    text.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-1 py-2">
      <div className="flex gap-2">
        <Input
          value={text.value}
          onChange={(event) => text.change(event.currentTarget.value)}
          placeholder="New prompt"
          aria-label="New prompt text"
          aria-invalid={Boolean(text.error)}
          aria-describedby={text.error ? "new-prompt-error" : undefined}
          maxLength={FIELD_MAX}
        />
        <Select
          value={type}
          onValueChange={(value) => {
            if (value) setType(value);
          }}
        >
          <SelectTrigger aria-label="Prompt type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROMPT_TYPES.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary" aria-label="Add prompt">
          <RiAddLine />
        </Button>
      </div>
      {text.error && (
        <p id="new-prompt-error" role="alert" className="text-destructive">
          {text.error}
        </p>
      )}
    </form>
  );
}
