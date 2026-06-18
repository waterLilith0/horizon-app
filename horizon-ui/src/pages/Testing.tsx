import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faReact } from "@fortawesome/free-brands-svg-icons";

function Testing() {
  return (
    <div>
      <FontAwesomeIcon icon={faUser} />
      <FontAwesomeIcon icon={faGithub} />
      <FontAwesomeIcon icon={faReact} />
    </div>
  );
}

export default Testing;
