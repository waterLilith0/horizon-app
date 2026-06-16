import './App.css'
import Navbar from './Infrastructure/Navbar.tsx'
import Footer from './Infrastructure/Footer.tsx'
import styled, { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    left: 0;
    top: 0;
  }
`

const Style = styled.div`
  * {
    top: 0;
    left: 0;
  }
`

function App() {
  return (
      <Style>
        <GlobalStyle />
        <Navbar />
        <Footer />
      </Style>
  )
}

export default App
