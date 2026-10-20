import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { themeAtom } from "@/shared/theme/configAtoms";
import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import AccountDialog from "./AccountDialog";
import { useCurrentUser } from "@/dashboard/features/auth/use-current-user";
import { logout } from "@/dashboard/features/auth/auth";
import LoginRegisterDialog from "../auth/LoginRegisterDialog";

export default function AccountDropdown({ className }: { className?: string }) {
  const [theme, setTheme] = useAtom(themeAtom);
  const [accountShown, setAccountShown] = useState(false);
  const [loginShown, setLoginShown] = useState(false);
  const { data: user, isPending } = useCurrentUser();

  async function handleLogout() {
    await logout();
    window.location.replace("/dashboard");
  }

  function changeTheme(newTheme: string) {
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
  }

  const initializeTheme = useCallback(() => {
    const savedTheme = localStorage.getItem("theme");

    if (
      savedTheme === "light" ||
      savedTheme === "dark" ||
      savedTheme === "system"
    ) {
      setTheme(savedTheme);
      return;
    }
    localStorage.setItem("theme", "dark");
    setTheme("dark");
  }, [setTheme]);

  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className={cn("fixed right-2 top-2", className)}>
            <AvatarFallback>
              {user ? user.username.slice(0, 2).toUpperCase() : "?"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            {user ? (
              <>
                <DropdownMenuItem onClick={() => setAccountShown(true)}>
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem
                disabled={isPending}
                onClick={() => setLoginShown(true)}
              >
                Log In/Register
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={changeTheme}
                  >
                    <DropdownMenuRadioItem value="light">
                      Light
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      Dark
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      System
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountDialog open={accountShown} onOpenChange={setAccountShown} />
      <LoginRegisterDialog open={loginShown} onOpenChange={setLoginShown} />
    </>
  );
}
