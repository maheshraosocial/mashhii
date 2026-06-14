"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Star, Lightbulb, Rocket, CheckCircle2, XCircle } from "lucide-react";
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

type FilterType = "all" | "planning" | "in_progress" | "launched" | "dropped";

const STATUS_ORDER: Record<IdeaStatus, number> = {
  IDEA: 1,
  RESEARCHING: 2,
  PLANNING: 3,
  BUILDING: 4,
  LAUNCHED: 5,
  DROPPED: 6,
};

export function IdeasClient({ ideas }: IdeasClientProps) {
  const [addDialog, setAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM" as IdeaPriority, rating: "5", tags: "" });

  // Filter ideas by status
  const filteredIdeas = useMemo(() => {
    let filtered = ideas;

    if (activeFilter === "planning") {
      filtered = ideas.filter((idea) => ["IDEA", "RESEARCHING", "PLANNING"].includes(idea.status));
    } else if (activeFilter === "in_progress") {
      filtered = ideas.filter((idea) => idea.status === "BUILDING");
    } else if (activeFilter === "launched") {
      filtered = ideas.filter((idea) => idea.status === "LAUNCHED");
    } else if (activeFilter === "dropped") {
      filtered = ideas.filter((idea) => idea.status === "DROPPED");
    }

    // Sort by status order, then priority, then rating
    return filtered.sort((a, b) => {
      const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (statusDiff !== 0) return statusDiff;
      
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [ideas, activeFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const planning = ideas.filter((i) => ["IDEA", "RESEARCHING", "PLANNING"].includes(i.status)).length;
    const inProgress = ideas.filter((i) => i.status === "BUILDING").length;
    const launched = ideas.filter((i) => i.status === "LAUNCHED").length;
    const dropped = ideas.filter((i) => i.status === "DROPPED").length;

    return { total: ideas.length, planning, inProgress, launched, dropped };
  }, [ideas]);

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
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Total Ideas</p>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="h-4 w-4 text-yellow-400" />
              <p className="text-xs font-medium text-muted-foreground">Planning</p>
            </div>
            <p className="text-2xl font-bold">{stats.planning}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Rocket className="h-4 w-4 text-violet-400" />
              <p className="text-xs font-medium text-muted-foreground">In Progress</p>
            </div>
            <p className="text-2xl font-bold">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <p className="text-xs font-medium text-muted-foreground">Launched</p>
            </div>
            <p className="text-2xl font-bold">{stats.launched}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-red-400" />
              <p className="text-xs font-medium text-muted-foreground">Dropped</p>
            </div>
            <p className="text-2xl font-bold">{stats.dropped}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={activeFilter === "all" ? "default" : "outline"}
            onClick={() => setActiveFilter("all")}
          >
            All ({ideas.length})
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "planning" ? "default" : "outline"}
            onClick={() => setActiveFilter("planning")}
          >
            Planning ({stats.planning})
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "in_progress" ? "default" : "outline"}
            onClick={() => setActiveFilter("in_progress")}
          >
            In Progress ({stats.inProgress})
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "launched" ? "default" : "outline"}
            onClick={() => setActiveFilter("launched")}
          >
            Launched ({stats.launched})
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "dropped" ? "default" : "outline"}
            onClick={() => setActiveFilter("dropped")}
          >
            Dropped ({stats.dropped})
          </Button>
        </div>
        <Button size="sm" onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Capture Idea
        </Button>
      </div>

      {filteredIdeas.length === 0 ? (
        <EmptyState icon={Plus} title="No ideas here" description={activeFilter === "all" ? "Capture your first idea before it slips away" : "No ideas match this filter"} action={activeFilter === "all" ? { label: "Capture Idea", onClick: () => setAddDialog(true) } : undefined} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map((idea) => (
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
