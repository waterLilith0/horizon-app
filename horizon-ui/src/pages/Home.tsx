import { ResponsiveImage } from "@/components/custom/ResponsiveImage";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MasonryGrid from "@/components/custom/MasonryGrid";

const cards = [
  {
    image: "",
    title: "Steampunk",
    content:
      "One of my favorite topics to talk about is Steampunk." +
      " It's a genre, scene, style and a lifestyle. Steampunk usually plays in a victorian fantasy scenario.",
  },
  {
    image: "",
    title: "Cyberpunk",
    content:
      "Yet another of my favorite topics, following the same vein as" +
      " Steampunk. The difference here is that Cyberpunk plays in a" +
      " dark dystopian future (as thought of from an 80s perspective)." +
      " Big works that influenced me here were most of William" +
      " Gibson's books, as well as the pen-and-paper Shadowrun.",
    footer: "This is the footer of the card.",
  },
  {
    image: "",
    title: "Programming",
    content:
      "Kinda plays into the Cyberpunk that I like so much, I like" +
      " programming while listening to some chill beats.",
    footer: "This is the footer of the card.",
  },
  {
    image: "",
    title: "Music",
    content:
      "Metal, Cabaret, some Pop, some Soundtracks (Made in Abyss by" +
      " Kevin Penkin) as well as most things electronic I'm constantly" +
      " listening to. There's only a few things that you will never" +
      " hear me listen to, german Schlager, gangster Rap, etc.",
    footer: "This is the footer of the card.",
  },
  {
    image: "",
    title: "Made in Abyss",
    content:
      "I'm a bit of a weeb so I like and have watched plenty of Manga" +
      " and Anime. My absolute favorite out of the literal over 100 is" +
      " by far Made in Abyss. It is a tragic and beautiful journey" +
      " filled with blessings and curses.",
    footer: "This is the footer of the card.",
  },
  {
    image: "",
    title: "Lord of the Rings",
    content:
      "Having first read the books as a child and then later watched" +
      " all of the movies, I can say that Tolkien's worldbuilding is" +
      " inspiring and fascinating. I've also read a lot of his lesser" +
      " known works, such as the Silmarillion (that was a big pain to" +
      " sit through!).",
    footer: "This is the footer of the card.",
  },
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
      <p>
        This is my own little website/tinkering space. I'm gonna continue
        updating this as I go (might be a good idea to look at this as kinda my
        own little blog I suppose).
      </p>
      <MasonryGrid>
        {cards.map((card, index) => (
          <Card className="w-md" key={index}>
            {card.image && (
              <ResponsiveImage
                src={card.image}
                alt={card.title}
                width="200px"
                ratio={16 / 9}
              />
            )}
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            <CardContent>{card.content}</CardContent>
            {card.footer && <CardFooter>{card.footer}</CardFooter>}
          </Card>
        ))}
      </MasonryGrid>
    </>
  );
}

export default Home;
