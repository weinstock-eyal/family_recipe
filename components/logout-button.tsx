"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => logoutAction()}
      className="gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <LogOut className="size-4" />
      יציאה
    </Button>
  );
}
