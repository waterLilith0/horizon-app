import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cards } from "@/site/content";

function Home() {
  return (
    <>
      <title>Home</title>
      <h1 className="text-4xl">Main Page</h1>
      <p>
        This is my own little website/tinkering space. I'm gonna continue
        updating this as I go (might be a good idea to look at this as kinda my
        own little blog I suppose).
      </p>
      <section className="flex flex-col gap-3">
        {cards.map((card) => (
          <Card key={card.title} className="w-full h-50 shrink-0">
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            <CardContent>{card.content}</CardContent>
            {card.footer && (
              <CardFooter>
                {card.footer}
                {card.link && (
                  <>
                    <p>{card.footer}</p>
                    <a href={card.link}>{card.link}</a>
                  </>
                )}
              </CardFooter>
            )}
          </Card>
        ))}
      </section>
    </>
  );
}

export default Home;
