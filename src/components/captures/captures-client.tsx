"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Inbox, Archive, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatRelativeDate } from "@/lib/utils";
import { createCapture, archiveCapture, convertCaptureToTask, deleteCapture } from "@/actions/captures";
import type { QuickCapture } from "@/types";

interface CapturesClientProps {
  captures: QuickCapture[];
}

export function CapturesClient({ captures }: CapturesClientProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const inbox = captures.filter((c) => c.status === "INBOX");
  const archived = captures.filter((c) => c.status !== "INBOX");

  const handleCapture = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    const result = await createCapture(content.trim());
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Captured!");
      setContent("");
    } else toast.error(result.error);
  };

  const handleArchive = async (id: string) => {
    const result = await archiveCapture(id);
    if (!result.success) toast.error(result.error);
    else toast.success("Archived");
  };

  const handleConvertToTask = async (id: string, captureContent: string) => {
    const result = await convertCaptureToTask(id, captureContent);
    if (!result.success) toast.error(result.error);
    else toast.success("Converted to task");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteCapture(deleteId);
    if (result.success) toast.success("Deleted");
    else toast.error(result.error);
    setDeleteId(null);
  };

  return (
    <>
      {/* Quick capture input */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Capture it here..."
            rows={3}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleCapture();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">⌘Enter to capture</p>
            <Button size="sm" onClick={handleCapture} disabled={isSubmitting || !content.trim()}>
              <Plus className="h-4 w-4 mr-1.5" />
              {isSubmitting ? "Capturing..." : "Capture"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inbox */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Inbox className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Inbox ({inbox.length})</h3>
        </div>
        {inbox.length === 0 ? (
          <EmptyState icon={Inbox} title="Inbox is empty" description="Everything's captured or you haven't added anything yet" />
        ) : (
          <div className="space-y-2">
            {inbox.map((capture) => (
              <Card key={capture.id}>
                <CardContent className="p-4">
                  <p className="text-sm whitespace-pre-wrap mb-3">{capture.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{formatRelativeDate(capture.createdAt)}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleConvertToTask(capture.id, capture.content)}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" /> To Task
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => handleArchive(capture.id)}
                      >
                        <Archive className="h-3 w-3 mr-1" /> Archive
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(capture.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Archived */}
      {archived.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Archived ({archived.length})
          </h3>
          <div className="space-y-2">
            {archived.map((capture) => (
              <Card key={capture.id} className="opacity-60">
                <CardContent className="flex items-center justify-between p-4">
                  <p className="text-sm text-muted-foreground line-clamp-1">{capture.content}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{capture.status.toLowerCase().replace("_", " ")}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(capture.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Capture"
        description="This will permanently delete this capture."
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
