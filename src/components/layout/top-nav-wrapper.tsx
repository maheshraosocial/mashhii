"use client";

import { TopNav as TopNavBase } from "@/components/layout/top-nav";
import { useCommandPalette } from "@/contexts/command-palette-context";
import type { Session } from "next-auth";

interface TopNavWrapperProps {
  session: Session | null;
}

export function TopNavWrapper({ session }: TopNavWrapperProps) {
  const { openCommandPalette } = useCommandPalette();

  return <TopNavBase session={session} onSearchOpen={openCommandPalette} />;
}
