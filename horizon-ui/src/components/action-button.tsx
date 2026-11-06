import type { ReactNode } from "react";
import { RiLoader4Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";

interface ActionButtonProps {
  // Names the button for screen readers when it has no text, and as a tooltip.
  label: string;
  icon?: ReactNode;
  text?: string;
  pending: boolean;
  error?: string;
  disabled?: boolean;
  onClick: () => unknown;
}

// A button for something that takes a moment and can fail: it shows progress
// in place of its icon, and the reason when it failed.
export function ActionButton({
  label,
  icon,
  text,
  pending,
  error,
  disabled,
  onClick,
}: ActionButtonProps) {
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="secondary"
        size={text ? "default" : "icon"}
        disabled={pending || disabled}
        aria-label={text ? undefined : label}
        title={label}
        onClick={() => void onClick()}
      >
        {pending ? <RiLoader4Line className="animate-spin" /> : icon}
        {text}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}
