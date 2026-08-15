// AdminUserDetailsDialog — per-user detail dialog for the Members tab.
// Identity and membership data render instantly from the users list row
// (already fetched by the tab); event registrations are fetched lazily
// from /admin/user-registrations when the dialog opens.
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  AdminUser,
  AdminUserEventRegistration,
  AdminUserRegistrations,
} from "./types";

type AdminUserDetailsDialogProps = {
  user: AdminUser | null;
  onClose: () => void;
};

const formatDateOnly = (value?: string | null) => {
  if (!value) {
    return "—";
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "—";
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const formatMoney = (value: number) => `${value} SEK`;

const formatPlan = (plan?: string | null) =>
  plan === "two_term" ? "Two terms" : plan === "single_term" ? "Single term" : "—";

const badgeClass = (kind: "emerald" | "amber" | "rose" | "purple" | "slate" | "blue") =>
  ({
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-400",
    rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-400",
    purple:
      "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/50 dark:text-purple-400",
    slate:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-400",
  })[kind];

const StatusBadge = ({ status }: { status: string }) => {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const kind =
    status === "confirmed"
      ? "emerald"
      : status === "cancelled"
        ? "rose"
        : status === "waitlisted"
          ? "blue"
          : "amber";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClass(kind)}`}>
      {label}
    </span>
  );
};

const PaymentStatusBadge = ({ status }: { status: string }) => {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const kind =
    status === "paid"
      ? "emerald"
      : status === "failed"
        ? "rose"
        : status === "refunded"
          ? "purple"
          : "amber";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClass(kind)}`}>
      {label}
    </span>
  );
};

const StatCard = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-lg border bg-muted/30 p-3">
    <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
      {icon}
      {label}
    </div>
    <div className="mt-1 text-sm font-semibold">{children}</div>
  </div>
);

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{children}</h4>
);

export const AdminUserDetailsDialog = ({ user, onClose }: AdminUserDetailsDialogProps) => {
  const [registrations, setRegistrations] = useState<AdminUserEventRegistration[] | null>(null);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setRegistrations(null);
      setLoadingRegistrations(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoadingRegistrations(true);
    setError(null);

    apiRequest(`/admin/user-registrations?user_id=${user.id}`)
      .then((data) => {
        if (!cancelled) {
          setRegistrations((data as AdminUserRegistrations).registrations ?? []);
        }
      })
      .catch((fetchError: unknown) => {
        const message =
          fetchError instanceof Error ? fetchError.message : "Failed to fetch registrations";
        if (!cancelled) {
          setError(message);
          toast.error(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingRegistrations(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const membershipPaidTotal = useMemo(
    () =>
      (user?.membership_payments ?? [])
        .filter((payment) => payment.payment_status === "paid")
        .reduce((sum, payment) => sum + payment.amount, 0),
    [user],
  );

  const registrationStats = useMemo(() => {
    const list = registrations ?? [];
    const paidTotal = list
      .filter((registration) => registration.payment_status === "paid")
      .reduce((sum, registration) => sum + registration.quoted_price, 0);
    const outstanding = list
      .filter(
        (registration) =>
          registration.payment_required && registration.payment_status === "unpaid",
      )
      .reduce((sum, registration) => sum + registration.quoted_price, 0);
    const confirmedCount = list.filter(
      (registration) => registration.status === "confirmed",
    ).length;

    return { paidTotal, outstanding, count: list.length, confirmedCount };
  }, [registrations]);

  return (
    <Dialog
      open={Boolean(user)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        {user ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">
                {`${user.first_name} ${user.last_name}`.trim()}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {user.email ?? "No email on record"}
                {user.role === "admin" ? (
                  <span className={`ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClass("blue")}`}>
                    Admin
                  </span>
                ) : null}
              </p>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <p><span className="text-muted-foreground">Phone:</span> {user.phone_number || "—"}</p>
                <p><span className="text-muted-foreground">Gender:</span> {user.gender || "—"}</p>
                <p><span className="text-muted-foreground">Study program:</span> {user.study_program || "—"}</p>
                <p><span className="text-muted-foreground">Term:</span> {user.term || "—"}</p>
                <p><span className="text-muted-foreground">Member since:</span> {formatDateOnly(user.created_at)}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={<Wallet className="h-3.5 w-3.5" />} label="Membership">
                  {user.membership_status === "paid" ? "Paid" : "Unpaid"} · {formatPlan(user.membership_plan)}
                </StatCard>
                <StatCard icon={<Wallet className="h-3.5 w-3.5" />} label="Membership paid">
                  {formatMoney(membershipPaidTotal)}
                </StatCard>
                <StatCard icon={<CalendarDays className="h-3.5 w-3.5" />} label="Events">
                  {loadingRegistrations
                    ? "Loading..."
                    : `${registrationStats.count} registered · ${registrationStats.confirmedCount} confirmed`}
                </StatCard>
                <StatCard icon={<AlertCircle className="h-3.5 w-3.5" />} label="Event payments">
                  {loadingRegistrations
                    ? "Loading..."
                    : `${formatMoney(registrationStats.paidTotal)} paid · ${formatMoney(registrationStats.outstanding)} outstanding`}
                </StatCard>
              </div>

              <div className="space-y-2">
                <SectionHeading>Membership payments</SectionHeading>
                {(user.membership_payments ?? []).length > 0 ? (
                  <div className="overflow-hidden rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Term</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Paid at</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.membership_payments!.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{payment.term}</TableCell>
                            <TableCell>{formatPlan(payment.plan)}</TableCell>
                            <TableCell>{formatMoney(payment.amount)}</TableCell>
                            <TableCell><PaymentStatusBadge status={payment.payment_status} /></TableCell>
                            <TableCell>{formatDateTime(payment.paid_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No membership payments yet.</p>
                )}
              </div>

              <div className="space-y-2">
                <SectionHeading>Event registrations</SectionHeading>
                {loadingRegistrations ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading registrations...
                  </div>
                ) : error ? (
                  <p className="text-sm text-muted-foreground">{error}</p>
                ) : registrations && registrations.length > 0 ? (
                  <div className="overflow-hidden rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Paid at</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrations.map((registration) => (
                          <TableRow key={registration.id}>
                            <TableCell>
                              <p className="font-medium">{registration.event?.title ?? `Event #${registration.event_id}`}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateOnly(registration.event?.date)}
                              </p>
                            </TableCell>
                            <TableCell><StatusBadge status={registration.status} /></TableCell>
                            <TableCell>
                              {registration.payment_required ? formatMoney(registration.quoted_price) : "—"}
                            </TableCell>
                            <TableCell>
                              {registration.payment_required ? (
                                <PaymentStatusBadge status={registration.payment_status} />
                              ) : (
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClass("slate")}`}>
                                  Free
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{formatDateTime(registration.payment_completed_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No event registrations yet.</p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
