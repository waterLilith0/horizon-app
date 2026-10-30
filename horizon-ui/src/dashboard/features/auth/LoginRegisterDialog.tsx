import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import VerifyEmailForm from "./VerifyEmailForm";
import ResetPasswordForm from "./ResetPasswordForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { useSearchParams } from "react-router";

type Mode =
  | "login"
  | "register"
  | "registered"
  | "verify_email"
  | "forgot_password"
  | "reset_password";

const TITLES: Record<Mode, string> = {
  login: "Log in",
  register: "Create an account",
  registered: "Check your email",
  verify_email: "Verify your email",
  forgot_password: "Reset your password",
  reset_password: "Set new password",
};

export default function LoginRegisterDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [searchParams] = useSearchParams();
  const verificationToken = searchParams.get("token");

  const [mode, setMode] = useState<Mode>(
    verificationToken ? "verify_email" : "login",
  );

  function handleOpenChange(next: boolean) {
    if (!next) setMode("login");
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{TITLES[mode]}</DialogTitle>
          {mode === "registered" && (
            <DialogDescription>
              Check your email for verification or reset link
            </DialogDescription>
          )}
        </DialogHeader>

        {mode === "login" && (
          <>
            <LoginForm onLoggedIn={() => handleOpenChange(false)} />
            <Button variant="link" onClick={() => setMode("register")}>
              No account yet? Register
            </Button>
            <Button variant="link" onClick={() => setMode("forgot_password")}>
              Forgot password?
            </Button>
          </>
        )}

        {mode === "register" && (
          <>
            <RegisterForm
              onRegistered={() => {
                setMode("registered");
              }}
            />
            <Button variant="link" onClick={() => setMode("login")}>
              Already have an account? Log in
            </Button>
          </>
        )}

        {mode === "registered" && (
          <Button onClick={() => handleOpenChange(false)}>Done</Button>
        )}

        {verificationToken && mode === "verify_email" && (
          <VerifyEmailForm
            token={verificationToken}
            onVerified={() => handleOpenChange(false)}
          />
        )}

        {mode === "forgot_password" && (
          <>
            <ForgotPasswordForm onSent={() => setMode("registered")} />
            <Button variant="link" onClick={() => setMode("login")}>
              Back to login
            </Button>
          </>
        )}

        {verificationToken && mode === "reset_password" && (
          <ResetPasswordForm
            token={verificationToken}
            onReset={() => handleOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
