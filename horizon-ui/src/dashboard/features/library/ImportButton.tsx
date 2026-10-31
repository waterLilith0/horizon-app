import type { ComponentProps } from "react";
import { UploadButton } from "@/components/upload-button";

// The button's trigger is hardcoded to the primary look, which vanishes on the
// page's primary-coloured panel, so it gets the secondary look from outside.
export default function ImportButton(
  props: ComponentProps<typeof UploadButton>,
) {
  return (
    <UploadButton
      className="**:data-[slot=upload-trigger]:bg-secondary **:data-[slot=upload-trigger]:text-secondary-foreground **:data-[slot=upload-trigger]:hover:bg-secondary/80"
      {...props}
    />
  );
}
