import { useAtom } from "jotai";
import { RiErrorWarningLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { plural } from "@/shared/format";
import { libraryAtom } from "../library/library.store";
import { countMissing, removeMissing, reuploadMissing } from "./sync.state";

// What the user decides when the server lost items that were uploaded: they
// were deleted elsewhere, so it is up to the user whether they come back.
export default function MissingOnServerNotice() {
  const [library, setLibrary] = useAtom(libraryAtom);
  const missing = countMissing(library);
  if (missing === 0) return null;

  return (
    <div
      role="alert"
      className="flex w-full flex-wrap items-center gap-2 rounded-md border border-destructive p-2 text-destructive"
    >
      <RiErrorWarningLine />
      <p className="grow">
        {plural(missing, "item")} in red {missing === 1 ? "is" : "are"} no
        longer on the server, so it was probably deleted from another device.
      </p>
      <Button variant="secondary" onClick={() => setLibrary(reuploadMissing)}>
        Upload again
      </Button>
      <Button
        variant="secondary"
        className="text-destructive"
        onClick={() => setLibrary(removeMissing)}
      >
        Remove from library
      </Button>
    </div>
  );
}
