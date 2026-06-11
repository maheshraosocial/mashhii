"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Eye, CheckCircle2, Building2, Pencil, Trash2, RotateCcw, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/shared/stats-card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";
import { oneClickMarkPaid, oneClickMarkPending, createProperty, updateProperty, deleteProperty } from "@/actions/rentals";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { Property, Tenant, RentPayment, PropertyType } from "@/types";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";

interface PropertyWithData extends Property {
  tenant: Tenant | null;
  rentPayments: RentPayment[];
}

interface RentalsClientProps {
  properties: PropertyWithData[];
  stats: {
    totalExpected: number;
    collected: number;
    pending: number;
    paidCount: number;
    pendingCount: number;
    totalProperties: number;
  };
  currentMonth: number;
  currentYear: number;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Format a date as DD-MMM-YYYY
function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = MONTH_NAMES[d.getMonth()];
  const yr = d.getFullYear();
  return `${day}-${mon}-${yr}`;
}

export function RentalsClient({ properties, stats, currentMonth, currentYear }: RentalsClientProps) {
  const [paying, setPaying] = useState<string | null>(null);
  const [reverting, setReverting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addDialog, setAddDialog] = useState(false);
  const [newProperty, setNewProperty] = useState({
    name: "",
    type: "APARTMENT_2BHK" as PropertyType,
    monthlyRent: "",
    notes: "",
  });

  const [editProperty, setEditProperty] = useState<{
    id: string;
    name: string;
    monthlyRent: string;
    type: PropertyType;
    notes: string;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /* ── One-click: mark paid ──────────────────────────────────────── */
  const handleOneClickPaid = async (propertyId: string) => {
    setPaying(propertyId);
    const result = await oneClickMarkPaid(propertyId);
    setPaying(null);
    if (result.success) toast.success("Rent marked as paid ✓");
    else toast.error(result.error);
  };

  /* ── Revert to pending ────────────────────────────────────────── */
  const handleRevertPending = async (paymentId: string) => {
    setReverting(paymentId);
    const result = await oneClickMarkPending(paymentId);
    setReverting(null);
    if (!result.success) toast.error(result.error);
  };

  /* ── Add Property ─────────────────────────────────────────────── */
  const handleAddProperty = async () => {
    if (!newProperty.name || !newProperty.monthlyRent) {
      toast.error("Tenant Name and Monthly Rent are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createProperty({
        name: newProperty.name,
        type: newProperty.type,
        monthlyRent: parseFloat(newProperty.monthlyRent),
        notes: newProperty.notes || null,
        occupancyStatus: "OCCUPIED",
      });
      if (result.success) {
        toast.success("Property added");
        setAddDialog(false);
        setNewProperty({ name: "", type: "APARTMENT_2BHK", monthlyRent: "", notes: "" });
      } else {
        toast.error(result.error ?? "Failed to add property");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Edit Property ────────────────────────────────────────────── */
  const handleEditProperty = async () => {
    if (!editProperty) return;
    if (!editProperty.name || !editProperty.monthlyRent) {
      toast.error("Tenant Name and Monthly Rent are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updateProperty(editProperty.id, {
        name: editProperty.name,
        type: editProperty.type,
        monthlyRent: parseFloat(editProperty.monthlyRent),
        notes: editProperty.notes || null,
        occupancyStatus: "OCCUPIED",
      });
      if (result.success) {
        toast.success("Property updated");
        setEditProperty(null);
      } else {
        toast.error(result.error ?? "Failed to update property");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Delete Property ──────────────────────────────────────────── */
  const handleDeleteProperty = async () => {
    if (!deleteId) return;
    const result = await deleteProperty(deleteId);
    if (result.success) toast.success("Property deleted");
    else toast.error(result.error);
    setDeleteId(null);
  };

  return (
    <>
      {/* ── Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Expected Rent"
          value={formatCurrency(stats.totalExpected)}
          icon={Building2}
          iconColor="text-blue-400"
          subtitle={`${MONTH_NAMES[currentMonth - 1]} ${currentYear}`}
        />
        <StatsCard
          title="Collected"
          value={formatCurrency(stats.collected)}
          icon={CheckCircle2}
          iconColor="text-emerald-400"
          subtitle={stats.paidCount > 0 ? `${stats.paidCount} ${stats.paidCount === 1 ? "property" : "properties"} paid` : "None collected yet"}
        />
        <StatsCard
          title="Pending"
          value={formatCurrency(stats.pending)}
          icon={Calendar}
          iconColor={stats.pending > 0 ? "text-yellow-400" : "text-emerald-400"}
          subtitle={stats.pendingCount > 0 ? `${stats.pendingCount} ${stats.pendingCount === 1 ? "property" : "properties"} pending` : "All collected!"}
        />
        <StatsCard
          title="Total Properties"
          value={String(stats.totalProperties)}
          icon={Building2}
          iconColor="text-violet-400"
          subtitle="Active rentals"
        />
      </div>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Properties ({properties.length}) — {MONTH_NAMES[currentMonth - 1]} {currentYear}
        </h2>
        <Button size="sm" onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Property
        </Button>
      </div>

      {/* ── Property Cards ──────────────────────────────────────── */}
      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Add your first property to start tracking rent"
          action={{ label: "Add Property", onClick: () => setAddDialog(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((property) => {
            const payment = property.rentPayments[0];
            const isPaid = payment?.status === "PAID";
            const rentAmount = parseFloat(property.monthlyRent.toString());

            return (
              <Card
                key={property.id}
                className={`transition-all ${
                  isPaid
                    ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                    : "border-yellow-500/30 hover:border-yellow-500/60"
                }`}
              >
                <CardContent className="p-5">
                  {/* ── Top row: tenant name + menu ── */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-base text-foreground">{property.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {PROPERTY_TYPE_LABELS[property.type]}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/rentals/${property.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View History
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() =>
                          setEditProperty({
                            id: property.id,
                            name: property.name,
                            monthlyRent: property.monthlyRent.toString(),
                            type: property.type as PropertyType,
                            notes: (property as unknown as { notes?: string }).notes ?? "",
                          })
                        }>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(property.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* ── Rent amount row ── */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                    <span className="text-xs text-muted-foreground">Monthly Rent</span>
                    <span className="text-base font-bold tabular-nums text-foreground">{formatCurrency(rentAmount)}</span>
                  </div>

                  {/* ── Payment Action Section ── */}
                  {isPaid ? (
                    /* ✅ PAID STATE */
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Paid</p>
                          {payment.paidDate && (
                            <p className="text-[11px] text-muted-foreground">
                              Paid on: {formatShortDate(payment.paidDate)}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        disabled={reverting === payment.id}
                        onClick={() => handleRevertPending(payment.id)}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {reverting === payment.id ? "Reverting…" : "Change to Pending"}
                      </button>
                    </div>
                  ) : (
                    /* ⏳ PENDING STATE */
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
                        <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending</span>
                      </div>
                      <Button
                        className="flex-1 h-9 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={paying === property.id}
                        onClick={() => handleOneClickPaid(property.id)}
                      >
                        {paying === property.id ? (
                          <span className="flex items-center gap-2">
                            <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Marking…
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Mark Paid
                          </span>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Add Property Dialog ──────────────────────────────── */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Property</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="propName">Tenant Name *</Label>
              <Input
                id="propName"
                placeholder="e.g. Niranjan"
                value={newProperty.name}
                onChange={(e) => setNewProperty((p) => ({ ...p, name: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Property Type *</Label>
              <Select
                value={newProperty.type}
                onValueChange={(v) => setNewProperty((p) => ({ ...p, type: v as PropertyType }))}
              >
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="propRent">Monthly Rent (₹) *</Label>
              <Input
                id="propRent"
                type="number"
                placeholder="15000"
                value={newProperty.monthlyRent}
                onChange={(e) => setNewProperty((p) => ({ ...p, monthlyRent: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="propNotes">Notes (optional)</Label>
              <Textarea
                id="propNotes"
                placeholder="Any notes about the property or tenant"
                value={newProperty.notes}
                onChange={(e) => setNewProperty((p) => ({ ...p, notes: e.target.value }))}
                className="mt-1.5 resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddProperty} disabled={isSubmitting}>
              {isSubmitting ? "Adding…" : "Add Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Property Dialog ─────────────────────────────── */}
      <Dialog open={!!editProperty} onOpenChange={(o) => !o && setEditProperty(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Property</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tenant Name *</Label>
              <Input
                value={editProperty?.name ?? ""}
                placeholder="e.g. Niranjan"
                onChange={(e) => setEditProperty((p) => p ? { ...p, name: e.target.value } : p)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Property Type</Label>
              <Select
                value={editProperty?.type ?? "APARTMENT_2BHK"}
                onValueChange={(v) => setEditProperty((p) => p ? { ...p, type: v as PropertyType } : p)}
              >
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monthly Rent (₹) *</Label>
              <Input
                type="number"
                value={editProperty?.monthlyRent ?? ""}
                onChange={(e) => setEditProperty((p) => p ? { ...p, monthlyRent: e.target.value } : p)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={editProperty?.notes ?? ""}
                onChange={(e) => setEditProperty((p) => p ? { ...p, notes: e.target.value } : p)}
                className="mt-1.5 resize-none"
                rows={3}
                placeholder="Any notes about the property or tenant"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProperty(null)}>Cancel</Button>
            <Button onClick={handleEditProperty} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Property"
        description="This will permanently delete this property and all associated rent records."
        onConfirm={handleDeleteProperty}
        destructive
      />
    </>
  );
}

