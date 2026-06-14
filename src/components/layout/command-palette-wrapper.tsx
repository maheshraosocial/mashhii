"use client";

import { CommandPalette } from "@/components/layout/command-palette";
import { useCommandPalette } from "@/contexts/command-palette-context";

export function CommandPaletteWrapper() {
  const { isOpen, setIsOpen } = useCommandPalette();

  return <CommandPalette open={isOpen} onOpenChange={setIsOpen} />;
}
