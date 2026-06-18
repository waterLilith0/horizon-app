import { useState } from "react";

function Footer() {
  const [links] = useState(["http://waterlilith.space"]);

  return (
    <div className="flex flex-row px-5 items-center w-full h-35 text-sidebar-foreground dark:text-sidebar-foreground bg-sidebar dark:bg-sidebar">
      {links.map((link) => {
        return (
          <a href={link} key={crypto.randomUUID()}>
            {link}
          </a>
        );
      })}
    </div>
  );
}

export default Footer;
