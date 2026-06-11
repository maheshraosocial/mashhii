"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Pin, Search } from "lucide-react";
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
import { formatRelativeDate } from "@/lib/utils";
import { createNote, updateNote, deleteNote, toggleNotePin } from "@/actions/notes";
import { NOTE_CATEGORY_LABELS } from "@/lib/constants";
import type { Note, NoteCategory } from "@/types";

interface NotesClientProps {
  notes: Note[];
}

export function NotesClient({ notes }: NotesClientProps) {
  const [search, setSearch] = useState("");
  const [addDialog, setAddDialog] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "PERSONAL" as NoteCategory, tags: "" });

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content?.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filtered.filter((n) => n.isPinned);
  const unpinned = filtered.filter((n) => !n.isPinned);

  const handleAdd = async () => {
    if (!form.title) { toast.error("Title is required"); return; }
    setIsSubmitting(true);
    const result = await createNote({
      title: form.title,
      content: form.content || undefined,
      category: form.category,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    });
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Note created");
      setAddDialog(false);
      setForm({ title: "", content: "", category: "PERSONAL", tags: "" });
    } else toast.error(result.error);
  };

  const handleUpdate = async () => {
    if (!editNote || !form.title) return;
    setIsSubmitting(true);
    const result = await updateNote(editNote.id, { title: form.title, content: form.content, category: form.category });
    setIsSubmitting(false);
    if (result.success) { toast.success("Note updated"); setEditNote(null); }
    else toast.error(result.error);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteNote(deleteId);
    if (result.success) toast.success("Note deleted");
    else toast.error(result.error);
    setDeleteId(null);
  };

  const handlePin = async (id: string, isPinned: boolean) => {
    const result = await toggleNotePin(id, !isPinned);
    if (!result.success) toast.error(result.error);
  };

  const openEdit = (note: Note) => {
    setEditNote(note);
    setForm({ title: note.title, content: note.content ?? "", category: note.category as NoteCategory, tags: "" });
  };

  const NoteCard = ({ note }: { note: Note }) => (
    <Card className="hover:border-primary/50 transition-colors cursor-default" onClick={() => openEdit(note)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            {note.isPinned && <Pin className="h-3.5 w-3.5 text-primary fill-primary" />}
            <h3 className="text-sm font-semibold leading-snug">{note.title}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePin(note.id, note.isPinned); }}>
                {note.isPinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteId(note.id); }} className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {note.content && <p className="text-xs text-muted-foreground line-clamp-3">{note.content.replace(/<[^>]*>/g, "")}</p>}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">{NOTE_CATEGORY_LABELS[note.category as NoteCategory]}</Badge>
          <span className="text-xs text-muted-foreground ml-auto">{formatRelativeDate(note.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..." className="pl-9" />
        </div>
        <Button size="sm" onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState icon={Plus} title="No notes yet" description="Create your first note" action={{ label: "New Note", onClick: () => setAddDialog(true) }} />
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pinned</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pinned.map((n) => <NoteCard key={n.id} note={n} />)}
              </div>
            </div>
          )}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Other Notes</h3>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {unpinned.map((n) => <NoteCard key={n.id} note={n} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addDialog || !!editNote} onOpenChange={(o) => { if (!o) { setAddDialog(false); setEditNote(null); setForm({ title: "", content: "", category: "PERSONAL", tags: "" }); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editNote ? "Edit Note" : "New Note"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as NoteCategory }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(NOTE_CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content</Label>
              <Textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} className="mt-1.5 min-h-40 font-mono text-sm" placeholder="Write your note..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialog(false); setEditNote(null); }}>Cancel</Button>
            <Button onClick={editNote ? handleUpdate : handleAdd} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editNote ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Note"
        description="This will permanently delete this note."
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
