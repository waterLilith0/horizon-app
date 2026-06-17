import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import styled from "styled-components";

const MainStyled = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: scroll;
  flex-grow: 1;
  flex-shrink: 1;
  height: 100%;
`;

function Main() {
  return (
    <MainStyled>
      <Card>
        <AspectRatio ratio={16 / 9}>
          <img
            src="../src/assets/pics/irl/20210323_184154.jpg"
            alt="Test Image"
          />
        </AspectRatio>
        <CardHeader>
          <CardTitle>Test</CardTitle>
        </CardHeader>
        <CardContent>
          This is a test page for Horizon UI. It is a simple page that
          demonstrates the use of the Card component.
        </CardContent>
        <CardFooter>This is the footer of the card.</CardFooter>
      </Card>
      <h1>Main Page</h1>
      <p>Test</p>
    </MainStyled>
  );
}

export default Main;
