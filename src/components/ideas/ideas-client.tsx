"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatRelativeDate, getIdeaStatusColor } from "@/lib/utils";
import { createIdea, updateIdeaStatus, deleteIdea } from "@/actions/ideas";
import { IDEA_STATUS_LABELS, IDEA_PRIORITY_LABELS } from "@/lib/constants";
import type { Idea, IdeaStatus, IdeaPriority } from "@/types";

interface IdeasClientProps {
  ideas: Idea[];
}

export function IdeasClient({ ideas }: IdeasClientProps) {
  const [addDialog, setAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM" as IdeaPriority, rating: "5", tags: "" });

  const handleAdd = async () => {
    if (!form.title) { toast.error("Title is required"); return; }
    setIsSubmitting(true);
    const result = await createIdea({
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      rating: parseInt(form.rating),
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    });
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Idea captured!");
      setAddDialog(false);
      setForm({ title: "", description: "", priority: "MEDIUM", rating: "5", tags: "" });
    } else toast.error(result.error);
  };

  const handleStatusChange = async (id: string, status: IdeaStatus) => {
    const result = await updateIdeaStatus(id, status);
    if (!result.success) toast.error(result.error);
    else toast.success("Status updated");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteIdea(deleteId);
    if (result.success) toast.success("Idea deleted");
    else toast.error(result.error);
    setDeleteId(null);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Ideas ({ideas.length})</h2>
        <Button size="sm" onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Capture Idea
        </Button>
      </div>

      {ideas.length === 0 ? (
        <EmptyState icon={Plus} title="No ideas yet" description="Capture your first idea before it slips away" action={{ label: "Capture Idea", onClick: () => setAddDialog(true) }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map((idea) => (
            <Card key={idea.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold leading-snug">{idea.title}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {Object.entries(IDEA_STATUS_LABELS).map(([v, l]) => (
                        <DropdownMenuItem key={v} onClick={() => handleStatusChange(idea.id, v as IdeaStatus)}>
                          {v === idea.status ? "✓ " : ""}{l}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(idea.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {idea.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{idea.description}</p>}

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-xs ${getIdeaStatusColor(idea.status)}`}>
                    {IDEA_STATUS_LABELS[idea.status as IdeaStatus]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{IDEA_PRIORITY_LABELS[idea.priority as IdeaPriority]}</Badge>
                  {idea.rating && (
                    <div className="flex items-center gap-0.5 ml-auto">
                      {Array.from({ length: idea.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{formatRelativeDate(idea.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Capture Idea</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="mt-1.5" placeholder="What's the idea?" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="mt-1.5" rows={4} placeholder="Describe your idea..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v as IdeaPriority }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(IDEA_PRIORITY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rating (1-10)</Label>
                <Input type="number" min={1} max={10} value={form.rating} onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} className="mt-1.5" placeholder="startup, tech, personal" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Capture"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Idea"
        description="This will permanently delete this idea."
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
