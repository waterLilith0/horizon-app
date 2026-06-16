import { useState } from 'react';
import styled from 'styled-components';

const StickyNavbar = styled.nav`
  display: flex;
  align-items: center;
  justify-content: left;
  position: sticky;
  background-color: darkgray;
  width: 100%;
  height: 7vh;
  z-index: 1000;

  ul {
    display: flex;
    flex-direction: row;
    list-style: none;
    gap: 20px;
    height: 100%;
    margin: 0;
    padding: 0;

    li:first-child {
      justify-self: left;
    }

    li {
      display: flex;
      align-items: center;
      height: 100%;
    }
  }
`;

const StyledLink = styled.a`
  color: white;
  text-decoration: none;
  display: block;
  height: 100%;
  padding: 0 20px;
  align-items: center;
  display: flex;
  transition: background-color 0.2s ease;

  &:hover {
    color: white;
    text-decoration: none;
    background-color: gray;
  }
`;

function Navbar() {
  const [links, setLinks] = useState([{link: "http://localhost:5173", name: "Home"}]);

  return (
    <StickyNavbar>
      <ul>
        {links.map(item => {
            const randomKey = crypto.randomUUID();
            return <li key={randomKey}><StyledLink href={item.link}>{item.name}</StyledLink></li>
          })}
      </ul>
    </StickyNavbar>
  )
}

export default Navbar;