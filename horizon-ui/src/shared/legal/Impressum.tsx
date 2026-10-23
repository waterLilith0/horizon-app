import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Impressum() {
  return (
    <div className="legal mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <title>Impressum</title>
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Impressum</h1>
        <p className="text-sm leading-7 text-muted-foreground">
          Informationen über den Diensteanbieter.
        </p>
      </header>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Angaben zum Diensteanbieter</CardTitle>
          <CardDescription>Miriam Fix</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-sm leading-7">
          <p>
            Reinbeckstr 4-8, Apt. 222, <br />
            12459 Berlin, <br />
            Deutschland
          </p>
          <p>
            <strong>Tel.:</strong> +49 172 7264849
            <br />
            <strong>E-Mail:</strong>{" "}
            <a href="mailto:contact@waterlilith.space">
              contact@waterlilith.space
            </a>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Inhaltsverzeichnis</CardTitle>
          <CardDescription>
            Wählen Sie einen Abschnitt, um direkt zum Thema zu springen.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 pt-4 sm:grid-cols-2">
          <a
            href="#bildernachweis"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Bildernachweis
          </a>
          <a
            href="#onlineauftritte"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Weitere Onlineauftritte
          </a>
        </CardContent>
      </Card>

      <Card className="scroll-mt-6">
        <CardHeader className="border-b pb-4">
          <h2
            id="bildernachweis"
            className="scroll-mt-6 text-xl font-semibold tracking-tight"
          >
            Bildernachweis
          </h2>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-sm leading-7">
          <p>
            Die Bilder, Fotos und Grafiken auf dieser Webseite sind
            urheberrechtlich geschützt.
          </p>
          <p>
            <strong>Die Bilderrechte liegen bei:</strong>
            <br />
            Fotografin Miriam Fix
          </p>
        </CardContent>
      </Card>

      <Card className="scroll-mt-6">
        <CardHeader className="border-b pb-4">
          <h2
            id="onlineauftritte"
            className="scroll-mt-6 text-xl font-semibold tracking-tight"
          >
            Weitere Onlineauftritte
          </h2>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-sm leading-7">
          <p>
            <strong>Dieses Impressum gilt auch für</strong>
            <br />
            <a href="https://github.com/waterlilith0" target="_blank">
              https://github.com/waterlilith0
            </a>
            <br />
            <a href="https://bsky.app/profile/waterlilith.space" target="_blank">
              https://bsky.app/profile/waterlilith.space
            </a>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Weitere Hinweise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-sm leading-7">
          <p>Alle Texte sind urheberrechtlich geschützt.</p>
          <p>
            Quelle: Erstellt mit dem{" "}
            <a
              href="https://www.adsimple.de/impressum-generator/"
              title="Impressum Generator Deutschland von AdSimple"
            >
              Impressum Generator
            </a>{" "}
            von AdSimple
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
