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

// ─── Nav structure ────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    id: "focus",
    label: "Focus",
    items: [
      { label: "Tasks",    href: "/tasks",    icon: CheckSquare },
      { label: "Habits",   href: "/habits",   icon: Flame },
      { label: "Goals",    href: "/goals",    icon: Target },
      { label: "Ideas",    href: "/ideas",    icon: Lightbulb },
      { label: "Projects", href: "/projects", icon: FolderKanban },
    ],
  },
  {
    id: "manage",
    label: "Manage",
    items: [
      { label: "Reminders", href: "/reminders", icon: Bell },
      { label: "Bills",     href: "/bills",     icon: Receipt },
      { label: "Rentals",   href: "/rentals",   icon: Building2 },
    ],
  },
  {
    id: "reference",
    label: "Reference",
    items: [
      { label: "Notes",     href: "/notes",     icon: FileText },
      { label: "Documents", href: "/documents", icon: Archive },
    ],
  },
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

  const NavItem = ({ item, isFocus }: { item: { label: string; href: string; icon: React.ElementType }; isFocus?: boolean }) => {
    const active = isActive(item.href);
    const link = (
      <Link
        href={item.href as Route}
        className={cn(
          "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-150",
          collapsed && "justify-center px-2",
          active
            ? "bg-primary/10 text-primary"
            : isFocus
            ? "text-sidebar-foreground hover:bg-accent/60 hover:text-foreground"
            : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
        )}
      >
        <item.icon
          className={cn(
            "shrink-0 transition-colors",
            collapsed ? "h-5 w-5" : "h-4 w-4",
            active
              ? "text-primary"
              : isFocus
              ? "text-muted-foreground group-hover:text-foreground"
              : "text-muted-foreground/70 group-hover:text-muted-foreground"
          )}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && active && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return link;
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
          <nav className="px-2 space-y-4">

            {/* Dashboard — standalone */}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/"
                    className={cn(
                      "flex items-center justify-center rounded-md px-2 py-1.5 transition-all duration-150",
                      isActive("/")
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Dashboard</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/"
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-150",
                  isActive("/")
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <LayoutDashboard className={cn("h-4 w-4 shrink-0", isActive("/") ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="truncate">Dashboard</span>
                {isActive("/") && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
              </Link>
            )}

            {/* Grouped sections */}
            {NAV_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-0.5">
                {/* Section header — hidden when collapsed */}
                {!collapsed && (
                  <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
                    {section.label}
                  </p>
                )}
                {/* Divider when collapsed */}
                {collapsed && (
                  <div className="mx-auto h-px w-7 bg-border/60 my-1" />
                )}
                {section.items.map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    isFocus={section.id === "focus"}
                  />
                ))}
              </div>
            ))}
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

