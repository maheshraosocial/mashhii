import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNavWrapper } from "@/components/layout/top-nav-wrapper";
import { CommandPaletteWrapper } from "@/components/layout/command-palette-wrapper";
import { CommandPaletteProvider } from "@/contexts/command-palette-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single auth check for entire dashboard
  const session = await auth();

  return (
    <CommandPaletteProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar — hidden on mobile, visible on md+ */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopNavWrapper session={session} />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-screen-2xl mx-auto p-4 md:p-6 animate-fade-in">
              {children}
            </div>
          </main>
        </div>

        {/* Global command palette */}
        <CommandPaletteWrapper />
      </div>
    </CommandPaletteProvider>
  );
}
