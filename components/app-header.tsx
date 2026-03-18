import Link from "next/link";
import { CookingPot, Home, ShoppingCart } from "lucide-react";
import { verifySession } from "@/src/lib/auth";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";

export async function AppHeader() {
  const session = await verifySession();

  if (!session) return null;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <CookingPot className="size-5" />
            מתכונים משפחתיים
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Home className="size-4" />
              דף הבית
            </Link>
            <Link
              href="/grocery"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ShoppingCart className="size-4" />
              רשימת קניות
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            שלום, {session.displayName}
          </span>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
