"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import {
  LayoutDashboard,
  Building2,
  Receipt,
  CheckSquare,
  FileText,
  Lightbulb,
  Flame,
  FolderKanban,
  Archive,
  TrendingUp,
  Target,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { APP_NAME } from "@/lib/constants";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Rentals", href: "/rentals", icon: Building2 },
  { label: "Bills", href: "/bills", icon: Receipt },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Notes", href: "/notes", icon: FileText },
  { label: "Ideas", href: "/ideas", icon: Lightbulb },
  { label: "Habits", href: "/habits", icon: Flame },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Documents", href: "/documents", icon: Archive },
  // { label: "Finance", href: "/finance", icon: TrendingUp }, // DISABLED
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Reminders", href: "/reminders", icon: Bell },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-200",
          collapsed ? "w-[60px]" : "w-[220px]",
          className
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border shrink-0",
          collapsed && "px-3 justify-center"
        )}>
          <Image
            src="/logo.jpg"
            alt="Mashhii"
            width={28}
            height={28}
            className="rounded-lg shrink-0 object-cover"
          />
          {!collapsed && (
            <span className="font-semibold text-sm text-sidebar-foreground truncate">
              {APP_NAME}
            </span>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-0.5 px-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const NavLink = (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-2",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "shrink-0 transition-colors",
                      collapsed ? "h-5 w-5" : "h-4 w-4",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{NavLink}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return NavLink;
            })}
          </nav>
        </ScrollArea>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border py-2 px-2 space-y-0.5 shrink-0">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/settings"
                  className={cn(
                    "flex items-center justify-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                    pathname.startsWith("/settings")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/settings")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full flex items-center rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2.5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
