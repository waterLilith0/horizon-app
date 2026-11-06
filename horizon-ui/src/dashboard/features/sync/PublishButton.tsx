import { RiGlobalLine, RiLockLine } from "@remixicon/react";
import { ActionButton } from "@/components/action-button";
import { useCurrentUser } from "@/dashboard/features/auth/auth";
import { useServerAction } from "@/shared/useServerAction";

interface PublishButtonProps {
  isPublic: boolean;
  publishLabel?: string;
  iconOnly?: boolean;
  onToggle: () => Promise<void>;
}

// Flips only once the server has answered, and only exists when logged in.
export default function PublishButton({
  isPublic,
  publishLabel = "Publish",
  iconOnly = false,
  onToggle,
}: PublishButtonProps) {
  const { data: user } = useCurrentUser();
  const { pending, error, run } = useServerAction(onToggle);

  if (!user) return null;

  const label = isPublic ? "Make private" : publishLabel;

  return (
    <ActionButton
      label={label}
      text={iconOnly ? undefined : label}
      icon={iconOnly ? isPublic ? <RiLockLine /> : <RiGlobalLine /> : undefined}
      pending={pending}
      error={error}
      onClick={run}
    />
  );
}
