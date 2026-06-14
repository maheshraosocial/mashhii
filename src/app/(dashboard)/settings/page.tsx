import { auth } from "@/lib/auth";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const session = await auth();

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
