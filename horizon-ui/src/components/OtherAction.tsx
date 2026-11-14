import { Button } from "@base-ui/react";
import { RiBookmarkFill, RiBookmarkLine } from "@remixicon/react";
import { useState } from "react";

export default function OtherAction() {
  const [inLibrary, setInLibrary] = useState(false);

  return (
    <>
      <Button
        onClick={() => setInLibrary(!inLibrary)}
        render={
          <span>{inLibrary ? <RiBookmarkFill /> : <RiBookmarkLine />}</span>
        }
      />
    </>
  );
}
