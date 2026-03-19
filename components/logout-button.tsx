"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <Button
      variant="ghost"
      size="default"
      onClick={() => logoutAction()}
      className="min-h-[44px] gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">יציאה</span>
    </Button>
  );
}
