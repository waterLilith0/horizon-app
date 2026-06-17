import { useState } from "react";
import styled from "styled-components";

const FooterStyled = styled.footer`
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  position: static;
  bottom: 0;
  left: 0;
  background-color: darkgray;
  height: 15vh;
`;

function Footer() {
  const [links] = useState(["http://waterlilith.space"]);

  return (
    <FooterStyled>
      {links.map((link) => {
        return (
          <a href={link} key={crypto.randomUUID()}>
            {link}
          </a>
        );
      })}
    </FooterStyled>
  );
}

export default Footer;
