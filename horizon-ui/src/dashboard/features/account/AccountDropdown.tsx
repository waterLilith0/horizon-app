import {
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AccountDialog from "./AccountDialog";
import {
  currentUserQueryKey,
  useCurrentUser,
} from "@/dashboard/features/auth/auth";
import LoginRegisterDialog from "../auth/LoginRegisterDialog";
import ThemeMenu from "./ThemeMenu";
import { useQueryClient } from "@tanstack/react-query";
import { usePostApiAuthLogout } from "@/api/generated/internal/horizonInternal";

export default function AccountDropdown() {
  const [accountShown, setAccountShown] = useState(false);
  const [loginShown, setLoginShown] = useState(false);
  const { data: user, isPending } = useCurrentUser();
  const queryClient = useQueryClient();
  const { mutateAsync: logout } = usePostApiAuthLogout();

  async function handleLogout() {
    await logout();
    queryClient.clear();
    queryClient.setQueryData(currentUserQueryKey, null);
  }

  return (
    <>
      <Collapsible>
        <SidebarMenuItem className="flex w-full flex-row items-center">
          <Avatar>
            <AvatarFallback>
              {user ? user.userName?.slice(0, 2).toUpperCase() : "?"}
            </AvatarFallback>
          </Avatar>
          <CollapsibleTrigger
            aria-label="Account menu"
            className="flex h-full w-full flex-row items-center ps-2 hover:underline hover:cursor-pointer"
          >
            <p className="text-sm leading-none">
              {user ? user.userName : "UserName"}
            </p>
          </CollapsibleTrigger>
        </SidebarMenuItem>
        <CollapsibleContent>
          <SidebarMenuItem>
            <SidebarMenuSub>
              {user ? (
                <>
                  <SidebarMenuSubButton
                    className="cursor-pointer"
                    onClick={() => setAccountShown(true)}
                  >
                    Profile
                  </SidebarMenuSubButton>
                  <SidebarMenuSubButton
                    className="cursor-pointer"
                    onClick={() => void handleLogout()}
                  >
                    Log out
                  </SidebarMenuSubButton>
                </>
              ) : (
                <>
                  <SidebarMenuSubButton
                    className="cursor-pointer"
                    isActive={isPending}
                    onClick={() => setLoginShown(true)}
                  >
                    Login/Register
                  </SidebarMenuSubButton>
                </>
              )}
              <>
                <ThemeMenu />
              </>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </CollapsibleContent>
      </Collapsible>

      <AccountDialog open={accountShown} onOpenChange={setAccountShown} />
      <LoginRegisterDialog open={loginShown} onOpenChange={setLoginShown} />
    </>
  );
}
