"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Eye, CheckCircle2, Building2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { markRentPaid, createProperty, updateProperty, deleteProperty } from "@/actions/rentals";
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
    occupancyRate: number;
  };
  currentMonth: number;
  currentYear: number;
}

export function RentalsClient({ properties, stats, currentMonth, currentYear }: RentalsClientProps) {
  const [markPaidDialog, setMarkPaidDialog] = useState<{ open: boolean; paymentId: string; amount: number }>({
    open: false,
    paymentId: "",
    amount: 0,
  });
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addDialog, setAddDialog] = useState(false);
  const [newProperty, setNewProperty] = useState({
    name: "",
    type: "APARTMENT_2BHK" as PropertyType,
    address: "",
    monthlyRent: "",
  });

  const [editProperty, setEditProperty] = useState<{ id: string; name: string; address: string; monthlyRent: string; type: PropertyType } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleMarkPaid = async () => {
    setIsSubmitting(true);
    const result = await markRentPaid(markPaidDialog.paymentId, {
      paidDate: new Date(paidDate),
      amount: markPaidDialog.amount,
      paymentMethod,
    });
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Rent marked as paid");
      setMarkPaidDialog({ open: false, paymentId: "", amount: 0 });
    } else {
      toast.error(result.error);
    }
  };

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
      occupancyStatus: "VACANT",
    });
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Property updated");
      setEditProperty(null);
    } else {
      toast.error(result.error);
    }
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
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Expected Rent" value={formatCurrency(stats.totalExpected)} icon={Building2} iconColor="text-blue-400" />
        <StatsCard title="Collected" value={formatCurrency(stats.collected)} icon={Building2} iconColor="text-green-400" />
        <StatsCard title="Pending" value={formatCurrency(stats.pending)} icon={Building2} iconColor={stats.pending > 0 ? "text-yellow-400" : "text-green-400"} />
        <StatsCard title="Occupancy" value={`${stats.occupancyRate}%`} icon={Building2} iconColor="text-violet-400" subtitle={`${properties.filter((p) => p.occupancyStatus === "OCCUPIED").length} of ${properties.length} occupied`} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Properties ({properties.length})</h2>
        <Button size="sm" onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Property
        </Button>
      </div>

      {/* Properties grid */}
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
            const tenantName = property.tenant?.name;

            return (
              <Card key={property.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{property.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {PROPERTY_TYPE_LABELS[property.type]}
                        {property.floor && ` · ${property.floor} Floor`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={property.occupancyStatus === "OCCUPIED" ? "success" : property.occupancyStatus === "VACANT" ? "outline" : "warning"}>
                        {property.occupancyStatus.toLowerCase()}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/rentals/${property.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditProperty({ id: property.id, name: property.name, address: property.address, monthlyRent: property.monthlyRent.toString(), type: property.type as PropertyType })}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(property.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tenant</span>
                      <span className="font-medium">{tenantName ?? "Vacant"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Rent</span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(parseFloat(property.monthlyRent.toString()))}
                      </span>
                    </div>
                    {payment && (
                      <div className="flex justify-between items-center pt-1 border-t border-border">
                        <span className="text-muted-foreground">This Month</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={isPaid ? "success" : payment.status === "OVERDUE" ? "error" : "warning"}>
                            {payment.status.toLowerCase()}
                          </Badge>
                          {!isPaid && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() =>
                                setMarkPaidDialog({
                                  open: true,
                                  paymentId: payment.id,
                                  amount: parseFloat(payment.amount.toString()),
                                })
                              }
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                          {isPaid && payment.paidDate && (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(payment.paidDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Mark Paid Dialog */}
      <Dialog open={markPaidDialog.open} onOpenChange={(o) => setMarkPaidDialog((p) => ({ ...p, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Rent as Paid</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount</Label>
              <Input value={formatCurrency(markPaidDialog.amount)} disabled className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="paidDate">Payment Date</Label>
              <Input
                id="paidDate"
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Bank Transfer", "Cash", "UPI", "Cheque", "NEFT", "IMPS"].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidDialog({ open: false, paymentId: "", amount: 0 })}>
              Cancel
            </Button>
            <Button onClick={handleMarkPaid} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Mark as Paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Property Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Property</DialogTitle>
          </DialogHeader>
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
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
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
              {isSubmitting ? "Adding..." : "Add Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Property Dialog */}
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
            <div>
              <Label>Monthly Rent (₹) *</Label>
              <Input
                type="number"
                value={editProperty?.monthlyRent ?? ""}
                onChange={(e) => setEditProperty((p) => p ? { ...p, monthlyRent: e.target.value } : p)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProperty(null)}>Cancel</Button>
            <Button onClick={handleEditProperty} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
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
