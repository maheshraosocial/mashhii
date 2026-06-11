"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { archiveCapture, convertCaptureToTask, createCapture } from "@/actions/captures";
import type { QuickCapture } from "@/types";

interface InboxWidgetProps {
  captures: QuickCapture[];
}

export function InboxWidget({ captures: initial }: InboxWidgetProps) {
  const [newText, setNewText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setIsAdding(true);
    const result = await createCapture(newText.trim());
    setIsAdding(false);
    if (result.success) { setNewText(""); toast.success("Captured"); }
    else toast.error(result.error);
  };

  const handleArchive = async (id: string) => {
    const result = await archiveCapture(id);
    if (!result.success) toast.error(result.error);
  };

  const handleConvert = async (id: string, content: string) => {
    const result = await convertCaptureToTask(id, content);
    if (result.success) toast.success("Added to tasks");
    else toast.error(result.error);
  };

  return (
    <div className="space-y-2">
      {/* Quick add */}
      <div className="flex gap-2">
        <Input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Capture a thought..."
          className="h-8 text-xs"
        />
        <Button size="sm" className="h-8 px-2" onClick={handleAdd} disabled={isAdding || !newText.trim()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {initial.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">Inbox is clear</p>
      ) : (
        initial.map((capture) => (
          <div key={capture.id} className="flex items-start gap-2 py-1.5 border-b border-border last:border-0 group">
            <p className="text-sm text-foreground flex-1 min-w-0 leading-snug">{capture.content}</p>
            <div className="flex gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
              <button
                title="Convert to task"
                onClick={() => handleConvert(capture.id, capture.content)}
                className="h-5 w-5 flex items-center justify-center rounded text-blue-500 hover:bg-blue-500/10"
              >
                <ArrowRight className="h-3 w-3" />
              </button>
              <button
                title="Dismiss"
                onClick={() => handleArchive(capture.id)}
                className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
