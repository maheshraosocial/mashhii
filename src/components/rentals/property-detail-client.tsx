"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, getMonthYear, safeDecimalToNumber } from "@/lib/utils";
import { oneClickMarkPaid, oneClickMarkPending } from "@/actions/rentals";
import { CheckCircle2, Clock, RotateCcw } from "lucide-react";
import type { Property, Tenant, RentPayment } from "@/types";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface PropertyWithAll extends Property {
  tenant: (Tenant & { rentPayments: RentPayment[] }) | null;
  rentPayments: RentPayment[];
}

interface PropertyDetailClientProps {
  property: PropertyWithAll;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = MONTH_NAMES[d.getMonth()];
  const yr = d.getFullYear();
  return `${day}-${mon}-${yr}`;
}

export function PropertyDetailClient({ property }: PropertyDetailClientProps) {
  const [paying, setPaying] = useState(false);
  const [reverting, setReverting] = useState<string | null>(null);

  const paidPayments = property.rentPayments.filter((p) => p.status === "PAID");
  const totalCollected = paidPayments.reduce((s, p) => s + safeDecimalToNumber(p.amount), 0);

  const handleMarkPaid = async () => {
    setPaying(true);
    const result = await oneClickMarkPaid(property.id);
    setPaying(false);
    if (result.success) toast.success("Rent marked as paid ✓");
    else toast.error(result.error);
  };

  const handleRevertPending = async (paymentId: string) => {
    setReverting(paymentId);
    const result = await oneClickMarkPending(paymentId);
    setReverting(null);
    if (!result.success) toast.error(result.error);
  };

  // Current month payment (first entry is newest due to desc ordering)
  const currentPayment = property.rentPayments[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Property Summary */}
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Property Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tenant Name</span>
              <span className="font-semibold">{property.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property Type</span>
              <span>{PROPERTY_TYPE_LABELS[property.type]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Rent</span>
              <span className="font-semibold">{formatCurrency(safeDecimalToNumber(property.monthlyRent))}</span>
            </div>
          </CardContent>
        </Card>

        {/* Current Month Status Card */}
        <Card>
          <CardHeader><CardTitle>Current Month</CardTitle></CardHeader>
          <CardContent>
            {currentPayment?.status === "PAID" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Paid</p>
                    {currentPayment.paidDate && (
                      <p className="text-xs text-muted-foreground">Paid on: {formatShortDate(currentPayment.paidDate)}</p>
                    )}
                  </div>
                </div>
                <button
                  disabled={reverting === currentPayment.id}
                  onClick={() => handleRevertPending(currentPayment.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="h-3 w-3" />
                  {reverting === currentPayment.id ? "Reverting…" : "Change to Pending"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending</span>
                </div>
                <Button
                  className="w-full h-9 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={paying}
                  onClick={handleMarkPaid}
                >
                  {paying ? (
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
      </div>

      {/* Right: Payment History */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <div className="flex gap-4 text-sm mt-2">
              <span className="text-muted-foreground">Total Collected:</span>
              <span className="font-semibold text-emerald-500">{formatCurrency(totalCollected)}</span>
              <span className="text-muted-foreground ml-4">Paid:</span>
              <span className="font-medium">{paidPayments.length} / {property.rentPayments.length} months</span>
            </div>
          </CardHeader>
          <CardContent>
            {property.rentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No payment records yet. Use Mark Paid on the main page to build history.</p>
            ) : (
              <div className="space-y-2">
                {property.rentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      payment.status === "PAID"
                        ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {payment.status === "PAID" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{getMonthYear(payment.month, payment.year)}</p>
                        {payment.status === "PAID" && payment.paidDate ? (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            Paid on {formatShortDate(payment.paidDate)}
                          </p>
                        ) : (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400">Pending</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCurrency(safeDecimalToNumber(payment.amount))}
                      </span>
                      <Badge variant={payment.status === "PAID" ? "success" : "warning"}>
                        {payment.status === "PAID" ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


interface PropertyWithAll extends Property {
  tenant: (Tenant & { rentPayments: RentPayment[] }) | null;
  rentPayments: RentPayment[];
}

interface PropertyDetailClientProps {
  property: PropertyWithAll;
}

