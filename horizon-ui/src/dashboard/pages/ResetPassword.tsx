import ResetPasswordForm from "../features/auth/ResetPasswordForm";
import EmailLinkPage from "./EmailLinkPage";

export default function ResetPassword() {
  return (
    <EmailLinkPage
      title="Set a new password"
      done="Your password was changed. You can log in with it from the menu."
    >
      {(token, onDone) => <ResetPasswordForm token={token} onReset={onDone} />}
    </EmailLinkPage>
  );
}
