import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AccountDialog from "./AccountDialog";
import {
  currentUserQueryKey,
  useCurrentUser,
} from "@/dashboard/features/auth/use-current-user";
import { logout } from "@/dashboard/features/auth/auth";
import LoginRegisterDialog from "../auth/LoginRegisterDialog";
import ThemeMenu from "@/dashboard/ThemeMenu";
import { useQueryClient } from "@tanstack/react-query";

export default function AccountDropdown() {
  const [accountShown, setAccountShown] = useState(false);
  const [loginShown, setLoginShown] = useState(false);
  const { data: user, isPending } = useCurrentUser();
  const queryClient = useQueryClient();

  async function handleLogout() {
    await logout();
    queryClient.clear();
    queryClient.setQueryData(currentUserQueryKey, null);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className="fixed right-2 top-2 z-10 rounded-full focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar>
              <AvatarFallback>
                {user ? user.username.slice(0, 2).toUpperCase() : "?"}
              </AvatarFallback>
            </Avatar>
          </button>
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
          <ThemeMenu />
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountDialog open={accountShown} onOpenChange={setAccountShown} />
      <LoginRegisterDialog open={loginShown} onOpenChange={setLoginShown} />
    </>
  );
}
