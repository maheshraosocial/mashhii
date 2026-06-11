"use client";

import { useState } from "react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { LogOut, User, Palette, Database, Monitor, Sun, Moon } from "lucide-react";
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

export function SettingsClient({ user }: SettingsClientProps) {
  const { theme, setTheme } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);

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
        <CardContent>
          <Label className="mb-3 block">Theme</Label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { id: "system", label: "System",  Icon: Monitor, desc: "Match OS setting" },
              { id: "light",  label: "Light",   Icon: Sun,     desc: "Always light"     },
              { id: "dark",   label: "Dark",    Icon: Moon,    desc: "Always dark"      },
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
