"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
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
  Plus,
} from "lucide-react";

const navigationItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, shortcut: "G D" },
  { label: "Rentals", href: "/rentals", icon: Building2, shortcut: "G R" },
  { label: "Bills", href: "/bills", icon: Receipt, shortcut: "G B" },
  { label: "Tasks", href: "/tasks", icon: CheckSquare, shortcut: "G T" },
  { label: "Notes", href: "/notes", icon: FileText, shortcut: "G N" },
  { label: "Ideas", href: "/ideas", icon: Lightbulb, shortcut: "G I" },
  { label: "Habits", href: "/habits", icon: Flame, shortcut: "G H" },
  { label: "Projects", href: "/projects", icon: FolderKanban, shortcut: "G P" },
  { label: "Documents", href: "/documents", icon: Archive, shortcut: "G O" },
  { label: "Finance", href: "/finance", icon: TrendingUp, shortcut: "G F" },
  { label: "Goals", href: "/goals", icon: Target, shortcut: "G G" },
  { label: "Reminders", href: "/reminders", icon: Bell, shortcut: "G M" },
  { label: "Settings", href: "/settings", icon: Settings },
];

const quickActions = [
  { label: "New Task", href: "/tasks?new=true", icon: Plus },
  { label: "New Note", href: "/notes?new=true", icon: Plus },
  { label: "New Capture", href: "/tasks?capture=true", icon: Plus },
  { label: "New Reminder", href: "/reminders?new=true", icon: Plus },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  const runCommand = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href as Route);
    },
    [onOpenChange, router]
  );

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search or navigate..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.href}
              onSelect={() => runCommand(action.href)}
            >
              <action.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {action.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => runCommand(item.href)}
            >
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {item.label}
              {item.shortcut && (
                <CommandShortcut>{item.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
