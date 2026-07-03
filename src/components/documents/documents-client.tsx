"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal, FileUp, Download, Trash2, File, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate, formatFileSize, formatRelativeDate } from "@/lib/utils";
import { uploadDocument, deleteDocument } from "@/actions/documents";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/constants";
import type { Document, DocumentCategory } from "@/types";

interface DocumentWithProperty extends Document {
  property: { id: string; name: string } | null;
}

interface DocumentsClientProps {
  documents: DocumentWithProperty[];
  properties: { id: string; name: string }[];
}

const ACCEPTED_TYPES = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx", ".xls", ".xlsx"];

export function DocumentsClient({ documents, properties }: DocumentsClientProps) {
  const [search, setSearch] = useState("");
  const [uploadDialog, setUploadDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", category: "OTHER" as DocumentCategory, propertyId: "__none__", expiryDate: "" });
  const [file, setFile] = useState<File | null>(null);

  const filtered = documents.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.property?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpload = async () => {
    if (!form.name || !file) { toast.error("Name and file are required"); return; }
    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", form.name);
    fd.append("category", form.category);
    if (form.propertyId && form.propertyId !== "__none__") fd.append("propertyId", form.propertyId);
    if (form.expiryDate) fd.append("expiryDate", form.expiryDate);
    const result = await uploadDocument(fd);
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Document uploaded");
      setUploadDialog(false);
      setForm({ name: "", category: "OTHER", propertyId: "__none__", expiryDate: "" });
      setFile(null);
    } else toast.error(result.error);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteDocument(deleteId);
    if (result.success) toast.success("Document deleted");
    else toast.error(result.error);
    setDeleteId(null);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="pl-9" />
        </div>
        <Button size="sm" onClick={() => setUploadDialog(true)}>
          <FileUp className="h-4 w-4 mr-1.5" /> Upload
        </Button>
      </div>

      {documents.length === 0 ? (
        <EmptyState icon={File} title="No documents yet" description="Upload your first important document" action={{ label: "Upload Document", onClick: () => setUploadDialog(true) }} />
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <File className="h-8 w-8 text-primary/60 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {DOCUMENT_CATEGORY_LABELS[doc.category as DocumentCategory]}
                      {doc.property && ` · ${doc.property.name}`}
                      {doc.fileSize && ` · ${formatFileSize(doc.fileSize)}`}
                      {` · ${formatRelativeDate(doc.createdAt)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.expiryDate && (
                    <Badge variant={new Date(doc.expiryDate) < new Date() ? "error" : "warning"} className="text-xs">
                      Exp {formatDate(doc.expiryDate)}
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" title="Download">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(doc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1.5" placeholder="Document name" />
            </div>
            <div>
              <Label>File *</Label>
              <Input type="file" accept={ACCEPTED_TYPES.join(",")} onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">PDF, images, Word, Excel up to 25MB</p>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as DocumentCategory }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Property (optional)</Label>
              <Select value={form.propertyId} onValueChange={(v) => setForm((p) => ({ ...p, propertyId: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input type="date" value={form.expiryDate} onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={isSubmitting || !file}>
              {isSubmitting ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Document"
        description="This will permanently delete this document file."
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
