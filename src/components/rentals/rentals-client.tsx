"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Eye, CheckCircle2, Building2, Pencil, Trash2, RotateCcw, Calendar } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/shared/stats-card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { oneClickMarkPaid, oneClickMarkPending, createProperty, updateProperty, deleteProperty } from "@/actions/rentals";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { Property, Tenant, RentPayment, PropertyType, OccupancyStatus } from "@/types";
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

export function RentalsClient({ properties, stats, currentMonth, currentYear }: RentalsClientProps) {
  const [paying, setPaying] = useState<string | null>(null);   // propertyId being one-click paid
  const [reverting, setReverting] = useState<string | null>(null); // paymentId being reverted
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addDialog, setAddDialog] = useState(false);
  const [newProperty, setNewProperty] = useState({
    name: "",
    type: "APARTMENT_2BHK" as PropertyType,
    address: "",
    monthlyRent: "",
  });

  const [editProperty, setEditProperty] = useState<{
    id: string; name: string; address: string; monthlyRent: string;
    type: PropertyType; occupancyStatus: OccupancyStatus; securityDeposit: string;
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

  /* ── Edit / Add / Delete ─────────────────────────────────────── */
  const handleEditProperty = async () => {
    if (!editProperty) return;
    if (!editProperty.name || !editProperty.address || !editProperty.monthlyRent) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    const result = await updateProperty(editProperty.id, {
      name: editProperty.name,
      address: editProperty.address,
      monthlyRent: parseFloat(editProperty.monthlyRent),
      type: editProperty.type,
      occupancyStatus: editProperty.occupancyStatus,
      securityDeposit: editProperty.securityDeposit ? parseFloat(editProperty.securityDeposit) : undefined,
    });
    setIsSubmitting(false);
    if (result.success) { toast.success("Property updated"); setEditProperty(null); }
    else toast.error(result.error);
  };

  const handleDeleteProperty = async () => {
    if (!deleteId) return;
    const result = await deleteProperty(deleteId);
    if (result.success) toast.success("Property deleted");
    else toast.error(result.error);
    setDeleteId(null);
  };

  const handleAddProperty = async () => {
    if (!newProperty.name || !newProperty.address || !newProperty.monthlyRent) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    const result = await createProperty({
      ...newProperty,
      monthlyRent: parseFloat(newProperty.monthlyRent),
      occupancyStatus: "VACANT",
    });
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Property added");
      setAddDialog(false);
      setNewProperty({ name: "", type: "APARTMENT_2BHK", address: "", monthlyRent: "" });
    } else {
      toast.error(result.error);
    }
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
            const isOverdue = payment?.status === "OVERDUE";
            const hasTenant = !!property.tenant;
            const rentAmount = parseFloat(property.monthlyRent.toString());

            return (
              <Card
                key={property.id}
                className={`transition-all ${
                  isPaid
                    ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                    : isOverdue
                    ? "border-red-500/40"
                    : hasTenant
                    ? "border-yellow-500/30 hover:border-yellow-500/60"
                    : "hover:border-primary/50"
                }`}
              >
                <CardContent className="p-5">
                  {/* ── Top row: name + menu ── */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{property.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {PROPERTY_TYPE_LABELS[property.type]}
                        {property.floor && ` · Floor ${property.floor}`}
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
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() =>
                          setEditProperty({
                            id: property.id,
                            name: property.name,
                            address: property.address,
                            monthlyRent: property.monthlyRent.toString(),
                            type: property.type as PropertyType,
                            occupancyStatus: property.occupancyStatus as OccupancyStatus,
                            securityDeposit: property.securityDeposit?.toString() ?? "",
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

                  {/* ── Details ── */}
                  <div className="space-y-1.5 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tenant</span>
                      <span className="font-medium">{property.tenant?.name ?? <span className="text-muted-foreground italic">No tenant</span>}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Rent</span>
                      <span className="font-semibold tabular-nums">{formatCurrency(rentAmount)}</span>
                    </div>
                  </div>

                  {/* ── Payment Action Section ── */}
                  {!hasTenant ? (
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground text-center py-1">No tenant assigned</p>
                    </div>
                  ) : isPaid ? (
                    /* ✅ PAID STATE */
                    <div className="pt-3 border-t border-emerald-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Paid</p>
                            {payment.paidDate && (
                              <p className="text-[11px] text-muted-foreground">
                                {formatDate(payment.paidDate)}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          disabled={reverting === payment.id}
                          onClick={() => handleRevertPending(payment.id)}
                          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          {reverting === payment.id ? "Reverting…" : "Change to Pending"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ⏳ PENDING / OVERDUE STATE */
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isOverdue
                            ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                        }`}>
                          {isOverdue ? "Overdue" : "Pending"}
                        </span>
                        {payment?.dueDate && (
                          <span className="text-[11px] text-muted-foreground">
                            Due {formatDate(payment.dueDate)}
                          </span>
                        )}
                      </div>
                      <Button
                        className="w-full h-10 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={paying === property.id}
                        onClick={() => handleOneClickPaid(property.id)}
                      >
                        {paying === property.id ? (
                          <span className="flex items-center gap-2">
                            <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Marking Paid…
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Mark Paid — {formatCurrency(rentAmount)}
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
              <Label htmlFor="propName">Property Name *</Label>
              <Input
                id="propName"
                placeholder="e.g. Ground Floor 2BHK"
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
              <Label htmlFor="propAddress">Address *</Label>
              <Input
                id="propAddress"
                placeholder="Full address"
                value={newProperty.address}
                onChange={(e) => setNewProperty((p) => ({ ...p, address: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="propRent">Monthly Rent (₹) *</Label>
              <Input
                id="propRent"
                type="number"
                placeholder="12000"
                value={newProperty.monthlyRent}
                onChange={(e) => setNewProperty((p) => ({ ...p, monthlyRent: e.target.value }))}
                className="mt-1.5"
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
              <Label>Property Name *</Label>
              <Input
                value={editProperty?.name ?? ""}
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
              <Label>Address *</Label>
              <Input
                value={editProperty?.address ?? ""}
                onChange={(e) => setEditProperty((p) => p ? { ...p, address: e.target.value } : p)}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <Label>Security Deposit (₹)</Label>
                <Input
                  type="number"
                  value={editProperty?.securityDeposit ?? ""}
                  onChange={(e) => setEditProperty((p) => p ? { ...p, securityDeposit: e.target.value } : p)}
                  className="mt-1.5"
                  placeholder="Optional"
                />
              </div>
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

