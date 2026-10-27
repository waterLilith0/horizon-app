import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  SidebarHeader,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      <Collapsible>
        <SidebarMenuItem className="flex flex-row align-middle">
          <Avatar>
            {user ? (
              <AvatarFallback>
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            ) : (
              <AvatarImage>{"?"}</AvatarImage>
            )}
          </Avatar>
          <CollapsibleTrigger
            aria-label="Account menu"
            className="flex flex-row items-center ps-2 w-full hover:bg-sidebar-primary rounded"
          >
            <p>{user ? user.username.slice(0, 2).toUpperCase() : "?"}</p>
          </CollapsibleTrigger>
        </SidebarMenuItem>
        <CollapsibleContent>
          <SidebarMenuItem>
            <SidebarHeader>Account</SidebarHeader>
            <SidebarMenuSub>
              {user ? (
                <>
                  <SidebarMenuSubButton>Profile</SidebarMenuSubButton>
                  <SidebarMenuSubButton>Log out</SidebarMenuSubButton>
                </>
              ) : (
                <>
                  <SidebarMenuSubButton>Login</SidebarMenuSubButton>
                  <SidebarMenuSubButton>Register</SidebarMenuSubButton>
                </>
              )}
              <SidebarMenuSubItem>Theme</SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </CollapsibleContent>
      </Collapsible>

      <DropdownMenu>
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
