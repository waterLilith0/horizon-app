import Footer from "@/components/custom/Footer";
import Navbar from "@/components/custom/Navbar";
import { Outlet } from "react-router";
import styled, { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    left: 0;
    top: 0;
    overflow: hidden;
}
`;

const Style = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;

  * {
    top: 0;
    left: 0;
  }
`;

function Layout() {
  return (
    <Style>
      <GlobalStyle />
      <Navbar />
      <Outlet />
      <Footer />
    </Style>
  );
}

export default Layout;
