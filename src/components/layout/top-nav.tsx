"use client";

import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import type { Session } from "next-auth";
import { useState, useEffect } from "react";
import {
  Menu,
  Search,
  Sun,
  Moon,
  LogOut,
  Settings,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { initials } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";

interface TopNavProps {
  session: Session | null;
  onSearchOpen?: () => void;
}

// Matches cuid / uuid-like dynamic segments
const isId = (s: string) => /^[a-z0-9]{20,}$/i.test(s) || /^[0-9a-f-]{36}$/.test(s);

function Breadcrumb() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const [lastLabel, setLastLabel] = useState<string | null>(null);

  // When navigating to a detail page (e.g. /rentals/abc123), read the
  // page title from document.title which Next.js populates from metadata.
  useEffect(() => {
    const lastPart = parts[parts.length - 1];
    if (lastPart && isId(lastPart)) {
      // document.title is set by Next.js metadata, e.g. "Ground Floor 2BHK | Mashhii"
      const title = document.title.replace(/\s*\|\s*Mashhii$/i, "").trim();
      setLastLabel(title || null);
    } else {
      setLastLabel(null);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const crumbs = [
    { label: "Mashhii", href: "/" },
    ...parts.map((part, i) => {
      const navItem = NAV_ITEMS.find((n) => n.href === `/${part}`);
      const isLast = i === parts.length - 1;
      return {
        label: navItem?.label ?? (isLast && isId(part) && lastLabel ? lastLabel : part.charAt(0).toUpperCase() + part.slice(1)),
        href: `/${parts.slice(0, i + 1).join("/")}`,
      };
    }),
  ];

  if (crumbs.length <= 1) {
    return <span className="text-sm text-muted-foreground">Dashboard</span>;
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted-foreground/50">/</span>}
          {i === crumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href as Route} className="text-muted-foreground hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export function TopNav({ session, onSearchOpen }: TopNavProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const user = session?.user;
  const userInitials = user?.name ? initials(user.name) : "M";

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-4 gap-3 sticky top-0 z-40">
      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[220px]">
          <Sidebar className="w-full border-r-0" />
        </SheetContent>
      </Sheet>

      {/* Breadcrumb */}
      <div className="flex-1 min-w-0">
        <Breadcrumb />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSearchOpen}
          className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground h-8 px-3"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search</span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
                <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </header>
  );
}
