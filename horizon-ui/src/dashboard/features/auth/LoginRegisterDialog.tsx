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

type Mode = "login" | "register" | "registered";

const TITLES: Record<Mode, string> = {
  login: "Log in",
  register: "Create an account",
  registered: "Check your inbox",
};

export default function LoginRegisterDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<Mode>("login");
  const [registeredEmail, setRegisteredEmail] = useState("");

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
              We sent a confirmation link to {registeredEmail}. Open it to
              finish signing up.
            </DialogDescription>
          )}
        </DialogHeader>

        {mode === "login" && (
          <>
            <LoginForm onLoggedIn={() => handleOpenChange(false)} />
            <Button variant="link" onClick={() => setMode("register")}>
              No account yet? Register
            </Button>
          </>
        )}

        {mode === "register" && (
          <>
            <RegisterForm
              onRegistered={(email) => {
                setRegisteredEmail(email);
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
      </DialogContent>
    </Dialog>
  );
}
