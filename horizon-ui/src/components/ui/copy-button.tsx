import { CheckIcon, CopyIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { Button } from "@/components/ui/button";

export type CopyButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "onCopy"
> & {
  content?: string;
  /** ms to keep the checkmark visible after a successful copy. */
  delay?: number;
  /** Called before the clipboard write. Return false to cancel. */
  onCopy?: (content: string) => undefined | boolean;
  isCopied?: boolean;
  onCopyChange?: (isCopied: boolean) => void;
};

export function CopyButton({
  content,
  delay = 3000,
  onClick,
  onCopy,
  isCopied,
  onCopyChange,
  size = "icon",
  ...props
}: CopyButtonProps) {
  const [localIsCopied, setLocalIsCopied] = React.useState(isCopied ?? false);
  const Icon = localIsCopied ? CheckIcon : CopyIcon;

  React.useEffect(() => {
    setLocalIsCopied(isCopied ?? false);
  }, [isCopied]);

  const setCopied = React.useCallback(
    (next: boolean) => {
      setLocalIsCopied(next);
      onCopyChange?.(next);
    },
    [onCopyChange],
  );

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (localIsCopied || !content) return;
    if (onCopy?.(content) === false) return;
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), delay);
      })
      .catch((error) => {
        console.error("Error copying content", error);
      });
  };

  return (
    <Button
      data-slot="copy-button"
      onClick={handleClick}
      size={size}
      {...props}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={localIsCopied ? "check" : "copy"}
          data-slot="copy-button-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Icon />
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}

export default CopyButton;
