import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

export default function NavbarWrapper() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="relative lg:hidden">
      <button
        className="lg:hidden fixed bottom-3 left-3 z-51"
        onClick={() => setMobileMenu(!mobileMenu)}
      >
        <FontAwesomeIcon icon={faBars} className="fa-2x" />
      </button>
    </div>
  );
}
