import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Item, ItemMedia } from "@/components/ui/item";

function About() {
  return (
    <>
      <title>About & Contact</title>
      <div className="flex flex-col items-center justify-center w-full h-full p-4 gap-4">
        <h1 className="pb-6">About Page</h1>
        <Item variant="muted" className="w-full flex-nowrap">
          <ItemMedia>
            <img
              src="https://pub-b6429b14f529453ba6124fb797bc3df6.r2.dev/0a.jpg"
              alt="picture of me"
              width="200px"
            />
          </ItemMedia>
          <Card className="shrink">
            <CardHeader>
              <CardTitle>Hi, I'm Miriam Lilith Fix</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                I'm a Junior Developer with a passion for creating neat little
                web applications. On this website I host a showcase of my work,
                as well as a portfolio of favorite pictures I've taken. I also
                have an API running over the same stack, check out the &gt;&gt;
                <a
                  href="/api"
                  className="hover:bg-gray-200 dark:hover:bg-gray-600 text-secondary-foreground dark:text-secondary-foreground px-1 rounded-md"
                >
                  API
                </a>
                &lt;&lt; page for more information.
                <br />
                <br />I also work with VRChat Avatar development, for which I
                make my own textures.
              </p>
            </CardContent>
          </Card>
        </Item>
        <Item variant="muted" className="w-full flex-nowrap">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Feel free to reach out if you have any questions or would like
                to collaborate!
              </p>
            </CardContent>
            <CardFooter>
              <p>Mail: </p>
              <a href="mailto:contact@waterlilith.space">
                contact@waterlilith.space
              </a>
            </CardFooter>
          </Card>
        </Item>
      </div>
    </>
  );
}

export default About;
