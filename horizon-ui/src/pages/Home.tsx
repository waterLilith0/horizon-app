import { ResponsiveImage } from "@/components/custom/ResponsiveImage";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MasonryGrid from "@/components/custom/MasonryGrid";
import { useAtomValue } from "jotai";
import { cardsAtom } from "@/dataAtoms";

function Home() {
  const cards = useAtomValue(cardsAtom);

  return (
    <>
      <title>Home</title>
      <h1 className="text-4xl">Main Page</h1>
      <p>
        This is my own little website/tinkering space. I'm gonna continue
        updating this as I go (might be a good idea to look at this as kinda my
        own little blog I suppose).
      </p>
      <MasonryGrid>
        {cards.map((card, index) => (
          <Card className="" key={index}>
            {card.image && (
              <ResponsiveImage
                src={card.image}
                alt={card.title}
                width="20px"
                // ratio={16 / 9}
              />
            )}
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            <CardContent>{card.content}</CardContent>
            {card.footer && (
              <CardFooter>
                {
                  <>
                    <p>{card.footer}</p>
                    <a href={card.link}>{card.link}</a>
                  </>
                }
              </CardFooter>
            )}
          </Card>
        ))}
      </MasonryGrid>
    </>
  );
}

export default Home;
