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
import ForgotPasswordForm from "./ForgotPasswordForm";

type Mode = "login" | "register" | "registered" | "forgot_password";

const TITLES: Record<Mode, string> = {
  login: "Log in",
  register: "Create an account",
  registered: "Check your email",
  forgot_password: "Reset your password",
};

export default function LoginRegisterDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<Mode>("login");

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
            <RegisterForm onRegistered={() => setMode("registered")} />
            <Button variant="link" onClick={() => setMode("login")}>
              Already have an account? Log in
            </Button>
          </>
        )}

        {mode === "registered" && (
          <Button onClick={() => handleOpenChange(false)}>Done</Button>
        )}

        {mode === "forgot_password" && (
          <>
            <ForgotPasswordForm onSent={() => setMode("registered")} />
            <Button variant="link" onClick={() => setMode("login")}>
              Back to login
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
