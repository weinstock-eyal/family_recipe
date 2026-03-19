"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Plus, Users, Settings } from "lucide-react";
import { cn } from "@/src/lib/utils";

const navItems = [
  { href: "/", label: "בית", icon: Home },
  { href: "/grocery", label: "קניות", icon: ShoppingCart },
  { href: "/recipes/new", label: "חדש", icon: Plus, highlight: true },
  { href: "/admin/users", label: "משתמשים", icon: Users, adminOnly: true },
];

export function MobileNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-lg px-3 py-1 transition-colors",
                item.highlight && "text-contrast",
                isActive && !item.highlight && "text-primary",
                !isActive && !item.highlight && "text-muted-foreground",
              )}
            >
              <Icon className={cn("size-5", item.highlight && "size-6")} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
