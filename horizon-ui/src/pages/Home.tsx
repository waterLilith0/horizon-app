import CardFitter from "@/components/custom/CardFitter";
import { ResponsiveImage } from "@/components/custom/Image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const cards = [
  { title: "Test", content: "This is a test card." },
  { title: "Test 2", content: "This is another test card." },
  { title: "Test 3", content: "This is yet another test card." },
  { title: "Test 4", content: "This is yet another test card." },
  { title: "Test 5", content: "This is yet another test card." },
  { title: "Test 6", content: "This is yet another test card." },
];

function Home() {
  return (
    <>
      <meta charSet="UTF-8" />
      <title>Home</title>
      <meta
        name="keywords"
        content="gallery, pictures, photography, waterLilith, art, personal, programming, vrchat, vrc"
      />
      <meta
        name="description"
        content="Just my own personal website, built with React and Tailwind CSS, including a portfolio of all my best pictures."
      />
      <meta name="author" content="waterLilith" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <h1 className="text-4xl">Main Page</h1>
      <p>Test</p>
      <CardFitter>
        {cards.map((card, index) => (
          <Card className="w-md" key={index}>
            <ResponsiveImage
              src="../src/assets/pics/irl/20210323_184154.jpg"
              alt="Test Image"
              width="200px"
              ratio={16 / 9}
            />
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            <CardContent>{card.content}</CardContent>
            <CardFooter>This is the footer of the card.</CardFooter>
          </Card>
        ))}
      </CardFitter>
    </>
  );
}

export default Home;
