"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { CommandPalette } from "@/components/layout/command-palette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — hidden on mobile, visible on md+ */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNav onSearchOpen={() => setCommandOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-screen-2xl mx-auto p-4 md:p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Global command palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
