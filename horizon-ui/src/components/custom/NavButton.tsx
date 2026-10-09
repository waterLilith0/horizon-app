import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function NavbarWrapper({
  setMobileMenu,
}: {
  setMobileMenu: () => void;
}) {
  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        aria-label="Toggle navigation menu"
        className="lg:hidden fixed bottom-3 right-3 z-51"
        onClick={setMobileMenu}
      >
        <FontAwesomeIcon icon={faBars} className="fa-2x" />
      </button>
    </div>
  );
}
