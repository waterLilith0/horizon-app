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
import ResetPasswordForm from "./ResetPasswordForm";
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
  registered: "Thamkiesss",
  verify_email: "Please vewify it's weally u!",
  forgot_password: "UWU reset ur password?",
  reset_password: "There ya go! New Password plss",
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
            <DialogDescription>Welcome in uwu</DialogDescription>
          )}
        </DialogHeader>

        {verificationToken && mode === "verify_email" && (
          <VerifyEmailForm
            token={verificationToken}
            onVerified={() => handleOpenChange(false)}
          />
        )}
        {verificationToken && mode === "reset_password" && (
          <ResetPasswordForm
            token={verificationToken}
            onVerified={() => handleOpenChange(false)}
            onReset={() => handleOpenChange(false)}
          />
        )}

        {mode === "login" && (
          <>
            <LoginForm onLoggedIn={() => handleOpenChange(false)} />
            <Button variant="link" onClick={() => setMode("register")}>
              No account yet? Register &gt;w&gt;
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
              U have an account after all??? click me
            </Button>
          </>
        )}

        {mode === "registered" && (
          <Button onClick={() => handleOpenChange(false)}>Done</Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
