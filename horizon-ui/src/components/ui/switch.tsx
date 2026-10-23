import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        // layout: no border, so the thumb offsets are exact
        "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none",
        "data-[size=default]:h-4.5 data-[size=default]:w-7",
        "data-[size=sm]:h-4 data-[size=sm]:w-6.5",
        // state colours, with an inset ring for contrast in light mode
        "ring-1 ring-inset ring-foreground/25",
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        "dark:data-[state=unchecked]:bg-input/80",
        // focus, invalid, disabled
        "focus-visible:ring-2 focus-visible:ring-ring/50",
        "aria-invalid:ring-2 aria-invalid:ring-destructive/40",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        // enlarged hit area
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none m-0 block rounded-full bg-foreground shadow-sm ring-0 transition-transform",
          "pointer-events-none block rounded-full bg-foreground shadow-sm ring-0 transition-transform",
          // default: 28px track, 14px thumb, flush at both ends
          "group-data-[size=default]/switch:size-3.5",
          "group-data-[size=default]/switch:data-[state=unchecked]:translate-x-0",
          "group-data-[size=default]/switch:data-[state=checked]:translate-x-3.5",
          // sm: 26px track, 12px thumb, flush at both ends
          "group-data-[size=sm]/switch:size-3",
          "group-data-[size=sm]/switch:data-[state=unchecked]:translate-x-0",
          "group-data-[size=sm]/switch:data-[state=checked]:translate-x-3.5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
