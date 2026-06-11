"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { LogOut, User, Palette, Database, Monitor, Sun, Moon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { initials } from "@/lib/utils";

interface SettingsClientProps {
  user: { name?: string | null; email?: string | null; image?: string | null } | null;
}

const ACCENT_COLORS = [
  { id: "purple", label: "Purple",  dot: "bg-purple-500" },
  { id: "ocean",  label: "Ocean",   dot: "bg-sky-500"    },
  { id: "forest", label: "Forest",  dot: "bg-green-600"  },
  { id: "sunset", label: "Sunset",  dot: "bg-orange-500" },
  { id: "rose",   label: "Rose",    dot: "bg-rose-500"   },
  { id: "amber",  label: "Amber",   dot: "bg-amber-500"  },
  { id: "teal",   label: "Teal",    dot: "bg-teal-500"   },
] as const;

const BG_THEMES = [
  { id: "default",   label: "Default",  preview: "bg-white dark:bg-zinc-950"        },
  { id: "slate",     label: "Slate",    preview: "bg-slate-100 dark:bg-slate-950"   },
  { id: "blue",      label: "Blue",     preview: "bg-blue-50 dark:bg-blue-950"      },
  { id: "green",     label: "Green",    preview: "bg-green-50 dark:bg-green-950"    },
  { id: "purple-bg", label: "Purple",   preview: "bg-purple-50 dark:bg-purple-950"  },
  { id: "amber-bg",  label: "Amber",    preview: "bg-amber-50 dark:bg-amber-950"    },
] as const;

export function SettingsClient({ user }: SettingsClientProps) {
  const { theme, setTheme } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [accentColor, setAccentColorState] = useState("purple");
  const [bgTheme, setBgThemeState] = useState("default");

  useEffect(() => {
    const stored = localStorage.getItem("mashhii-accent");
    if (stored) setAccentColorState(stored);
    const storedBg = localStorage.getItem("mashhii-bg");
    if (storedBg) setBgThemeState(storedBg);
  }, []);

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    localStorage.setItem("mashhii-accent", color);
    if (color === "purple") {
      document.documentElement.removeAttribute("data-color");
    } else {
      document.documentElement.setAttribute("data-color", color);
    }
  };

  const setBgTheme = (bg: string) => {
    setBgThemeState(bg);
    localStorage.setItem("mashhii-bg", bg);
    if (bg === "default") {
      document.documentElement.removeAttribute("data-bg");
    } else {
      document.documentElement.setAttribute("data-bg", bg);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
            <AvatarFallback className="text-lg">{initials(user?.name ?? "U")}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg">{user?.name ?? "Unknown"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-1">Authenticated via Google OAuth</p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" /> Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel of your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Brightness mode */}
          <div>
            <Label className="mb-3 block text-sm font-medium">Mode</Label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { id: "system", label: "System", Icon: Monitor, desc: "Match OS" },
                { id: "light",  label: "Light",  Icon: Sun,     desc: "Always light" },
                { id: "dark",   label: "Dark",   Icon: Moon,    desc: "Always dark"  },
              ] as const).map(({ id, label, Icon, desc }) => (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all focus:outline-none ${
                    theme === id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/40 hover:bg-accent"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${theme === id ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-center">
                    <p className={`text-sm font-medium ${theme === id ? "text-primary" : ""}`}>{label}</p>
                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Background theme */}
          <div>
            <Label className="mb-3 block text-sm font-medium">Background</Label>
            <div className="grid grid-cols-3 gap-2">
              {BG_THEMES.map(({ id, label, preview }) => (
                <button
                  key={id}
                  onClick={() => setBgTheme(id)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-2.5 transition-all focus:outline-none ${
                    bgTheme === id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <div className={`h-8 w-full rounded ${preview} border border-border/40 flex items-center justify-center`}>
                    {bgTheme === id && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <span className={`text-[11px] font-medium ${bgTheme === id ? "text-primary" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Accent color */}
          <div>
            <Label className="mb-3 block text-sm font-medium">Accent Color</Label>
            <div className="flex flex-wrap gap-3">
              {ACCENT_COLORS.map(({ id, label, dot }) => (
                <button
                  key={id}
                  onClick={() => setAccentColor(id)}
                  title={label}
                  className={`group relative flex flex-col items-center gap-1.5 focus:outline-none`}
                >
                  <div className={`h-9 w-9 rounded-full ${dot} flex items-center justify-center transition-all ring-offset-2 ring-offset-background ${
                    accentColor === id ? "ring-2 ring-foreground scale-110" : "hover:scale-105 opacity-80 hover:opacity-100"
                  }`}>
                    {accentColor === id && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-[11px] ${accentColor === id ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" /> App Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Application</span>
            <span className="font-medium">Mashhii</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Stack</span>
            <span>Next.js 15 · Prisma · PostgreSQL</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Auth</span>
            <span>Google OAuth (Single User)</span>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign Out</p>
              <p className="text-xs text-muted-foreground">Sign out of your account</p>
            </div>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
