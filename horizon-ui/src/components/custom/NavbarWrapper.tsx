import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

export default function NavbarWrapper({ children }) {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <>
      <button
        className="lg:hidden fixed top-3 left-3 z-51"
        onClick={() => setMobileMenu(!mobileMenu)}
      >
        <FontAwesomeIcon icon={faBars} className="fa-2x" />
      </button>
      {{ ...children }}
    </>
  );
}
