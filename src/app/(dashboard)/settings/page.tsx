import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsClient } from "@/components/settings/settings-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your application preferences"
        icon={Settings}
        iconColor="text-muted-foreground"
      />
      <SettingsClient user={session.user ?? null} />
    </div>
  );
}
