import VerifyEmailForm from "../features/auth/VerifyEmailForm";
import EmailLinkPage from "./EmailLinkPage";

export default function VerifyEmail() {
  return (
    <EmailLinkPage
      title="Verify your email"
      done="Your email is verified. You can log in from the menu."
    >
      {(token, onDone) => <VerifyEmailForm token={token} onVerified={onDone} />}
    </EmailLinkPage>
  );
}
