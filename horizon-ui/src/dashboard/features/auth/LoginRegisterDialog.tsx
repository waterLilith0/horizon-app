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
  registered: "Thamkiesss",
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
            <DialogDescription>Welcome in uwu</DialogDescription>
          )}
        </DialogHeader>

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
