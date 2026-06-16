import { useState } from 'react';

function Footer() {
  const [links, setLinks] = useState(["http://waterlilith.space"]);

  return (
    <footer>
      {
        links.map(link => {
          return <a href={link} key={crypto.randomUUID()}>{link}</a>
        })
      }
    </footer>
  )
}

export default Footer;