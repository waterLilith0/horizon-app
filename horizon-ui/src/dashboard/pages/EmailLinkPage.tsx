import { useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import Page from "../layout/Page";

interface EmailLinkPageProps {
  title: string;
  // Shown once the backend accepted the token.
  done: string;
  // The form that sends the token on, with what to call when it was accepted.
  children: (token: string, onDone: () => void) => ReactNode;
}

// What a link from an email opens: the token in it is what the backend acts on.
export default function EmailLinkPage({
  title,
  done,
  children,
}: EmailLinkPageProps) {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [finished, setFinished] = useState(false);

  return (
    <Page>
      <div className="my-4 flex w-full max-w-md flex-col gap-4 rounded-md bg-card p-4 text-card-foreground">
        <h1 className="text-xl font-semibold">{title}</h1>
        {finished ? (
          <p>{done}</p>
        ) : token ? (
          children(token, () => setFinished(true))
        ) : (
          <p role="alert" className="text-destructive">
            This link is incomplete. Open it again from the email.
          </p>
        )}
        <Link to="/" className="underline hover:no-underline">
          Back to home
        </Link>
      </div>
    </Page>
  );
}
