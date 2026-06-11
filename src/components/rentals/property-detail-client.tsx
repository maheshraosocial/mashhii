"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate, getMonthYear, safeDecimalToNumber } from "@/lib/utils";
import { markRentPaid } from "@/actions/rentals";
import { CheckCircle2, Clock, IndianRupee } from "lucide-react";
import type { Property, Tenant, RentPayment } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PropertyWithAll extends Property {
  tenant: (Tenant & { rentPayments: RentPayment[] }) | null;
  rentPayments: RentPayment[];
}

interface PropertyDetailClientProps {
  property: PropertyWithAll;
}

export function PropertyDetailClient({ property }: PropertyDetailClientProps) {
  const [markPaidDialog, setMarkPaidDialog] = useState<{ open: boolean; paymentId: string; amount: number }>({
    open: false, paymentId: "", amount: 0,
  });
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paidPayments = property.rentPayments.filter((p) => p.status === "PAID");
  const totalCollected = paidPayments.reduce((s, p) => s + safeDecimalToNumber(p.amount), 0);

  const handleMarkPaid = async () => {
    setIsSubmitting(true);
    const result = await markRentPaid(markPaidDialog.paymentId, {
      paidDate: new Date(paidDate),
      amount: markPaidDialog.amount,
    });
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Marked as paid");
      setMarkPaidDialog({ open: false, paymentId: "", amount: 0 });
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property info */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Property Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                <Badge variant={property.occupancyStatus === "OCCUPIED" ? "success" : "outline"}>
                  {property.occupancyStatus.toLowerCase()}
                </Badge>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Monthly Rent</span>
                <span className="font-medium">{formatCurrency(safeDecimalToNumber(property.monthlyRent))}</span>
              </div>
              {property.securityDeposit && (
                <div className="flex justify-between"><span className="text-muted-foreground">Security Deposit</span>
                  <span>{formatCurrency(safeDecimalToNumber(property.securityDeposit))}</span>
                </div>
              )}
              {property.area && (
                <div className="flex justify-between"><span className="text-muted-foreground">Area</span>
                  <span>{property.area} sq ft</span>
                </div>
              )}
            </CardContent>
          </Card>

          {property.tenant && (
            <Card>
              <CardHeader><CardTitle>Tenant</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{property.tenant.name}</span>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span>
                  <span>{property.tenant.phone}</span>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Lease Start</span>
                  <span>{formatDate(property.tenant.leaseStartDate)}</span>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span>
                  <span>{property.tenant.dueDate}th of month</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment history */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <div className="flex gap-4 text-sm mt-2">
                <span className="text-muted-foreground">Total Collected:</span>
                <span className="font-semibold text-green-400">{formatCurrency(totalCollected)}</span>
                <span className="text-muted-foreground ml-4">Payments:</span>
                <span className="font-medium">{paidPayments.length} / {property.rentPayments.length}</span>
              </div>
            </CardHeader>
            <CardContent>
              {property.rentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No payment records yet</p>
              ) : (
                <div className="space-y-2">
                  {property.rentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {payment.status === "PAID" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{getMonthYear(payment.month, payment.year)}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {formatDate(payment.dueDate)}
                            {payment.paidDate && ` · Paid: ${formatDate(payment.paidDate)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium tabular-nums">
                          {formatCurrency(safeDecimalToNumber(payment.amount))}
                        </span>
                        <Badge variant={payment.status === "PAID" ? "success" : payment.status === "OVERDUE" ? "error" : "warning"}>
                          {payment.status.toLowerCase()}
                        </Badge>
                        {payment.status !== "PAID" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setMarkPaidDialog({ open: true, paymentId: payment.id, amount: safeDecimalToNumber(payment.amount) })}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={markPaidDialog.open} onOpenChange={(o) => setMarkPaidDialog((p) => ({ ...p, open: o }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark Rent as Paid</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount</Label>
              <Input value={formatCurrency(markPaidDialog.amount)} disabled className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="pd">Payment Date</Label>
              <Input id="pd" type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidDialog({ open: false, paymentId: "", amount: 0 })}>Cancel</Button>
            <Button onClick={handleMarkPaid} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Mark as Paid"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
