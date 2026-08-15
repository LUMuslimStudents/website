// AdminTreasuryTab — treasurer view with per-term income summary.
// Overview cards + category breakdown + a single exportable income table
// (one row per payment across memberships and event registrations).
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { AdminDataTable, type AdminDataColumn } from "./AdminDataTable";
import {
  AdminTreasuryIncomeRow,
  AdminTreasuryReport,
} from "./types";

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

const OverviewCard = ({
  label,
  value,
  subLabel,
}: {
  label: string;
  value: string;
  subLabel?: string;
}) => (
  <div className="rounded-lg border bg-muted/30 p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 text-xl font-semibold">{value}</p>
    {subLabel ? <p className="mt-0.5 text-xs text-muted-foreground">{subLabel}</p> : null}
  </div>
);

const incomeColumns: AdminDataColumn<AdminTreasuryIncomeRow>[] = [
  {
    id: "date",
    label: "Date",
    getSearchValue: (row) => row.paid_at ?? "",
    getSortValue: (row) => row.paid_at ?? "",
    getDisplayValue: (row) => formatDateTime(row.paid_at),
    filterMode: "contains",
    placeholder: "Search date",
  },
  {
    id: "amount",
    label: "Amount",
    getSearchValue: (row) => String(row.amount),
    getSortValue: (row) => String(row.amount),
    getDisplayValue: (row) => formatMoney(row.amount),
  },
  {
    id: "source",
    label: "Source",
    getSearchValue: (row) => row.kind,
    getSortValue: (row) => row.kind,
    getDisplayValue: (row) =>
      row.kind === "membership"
        ? row.plan
          ? `Membership · ${formatPlan(row.plan)}`
          : "Membership"
        : "Event",
    filterOptions: [
      { label: "Membership", value: "membership" },
      { label: "Event", value: "event" },
    ],
  },
  {
    id: "event",
    label: "Event",
    getSearchValue: (row) => row.event_title ?? "",
    getSortValue: (row) => row.event_title ?? "",
    getDisplayValue: (row) => row.event_title ?? "—",
    renderCell: (row) =>
      row.event_title ? (
        <div>
          <p className="font-medium">{row.event_title}</p>
          <p className="text-xs text-muted-foreground">{formatDateOnly(row.event_date)}</p>
        </div>
      ) : (
        "—"
      ),
    filterMode: "contains",
    placeholder: "Search event",
  },
  {
    id: "member",
    label: "Member",
    getSearchValue: (row) => (row.kind === "membership" ? "" : row.member ? "yes" : "no"),
    getSortValue: (row) => (row.kind === "membership" ? "1" : row.member ? "1" : "0"),
    getDisplayValue: (row) => (row.kind === "membership" ? "—" : row.member ? "Yes" : "No"),
    filterOptions: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
  {
    id: "payer",
    label: "Payer",
    getSearchValue: (row) => row.payer_name,
    getSortValue: (row) => row.payer_name,
    getDisplayValue: (row) => row.payer_name,
    filterMode: "contains",
    placeholder: "Search payer",
  },
  {
    id: "email",
    label: "Email",
    getSearchValue: (row) => row.payer_email ?? "",
    getSortValue: (row) => row.payer_email ?? "",
    getDisplayValue: (row) => row.payer_email ?? "—",
    filterMode: "contains",
    placeholder: "Search email",
  },
  {
    id: "phone",
    label: "Phone",
    getSearchValue: (row) => row.payer_phone ?? "",
    getSortValue: (row) => row.payer_phone ?? "",
    getDisplayValue: (row) => row.payer_phone ?? "—",
    filterMode: "contains",
    placeholder: "Search phone",
  },
  {
    id: "status",
    label: "Status",
    getSearchValue: (row) => row.payment_status,
    getSortValue: (row) => row.payment_status,
    getDisplayValue: (row) => row.payment_status,
    renderCell: (row) => <PaymentStatusBadge status={row.payment_status} />,
    filterOptions: [
      { label: "Paid", value: "paid" },
      { label: "Failed", value: "failed" },
      { label: "Refunded", value: "refunded" },
    ],
  },
];

export const AdminTreasuryTab = () => {
  const [report, setReport] = useState<AdminTreasuryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string>("all");
  const termTouchedRef = useRef(false);

  // Bootstrap: load the unfiltered report once to get the term list and the
  // current term, then switch to the current term.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = (await apiRequest("/admin/treasury-report")) as AdminTreasuryReport;
        if (cancelled) {
          return;
        }
        setReport(data);
        const defaultTerm =
          data.current_term && data.terms.includes(data.current_term)
            ? data.current_term
            : null;
        if (defaultTerm) {
          setSelectedTerm(defaultTerm);
          termTouchedRef.current = true;
        }
      } catch (error: unknown) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to fetch treasury report");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Refetch whenever the selected term changes.
  useEffect(() => {
    if (!termTouchedRef.current) {
      return;
    }

    let cancelled = false;
    setRefreshing(true);
    const endpoint =
      selectedTerm === "all"
        ? "/admin/treasury-report"
        : `/admin/treasury-report?term=${encodeURIComponent(selectedTerm)}`;

    apiRequest(endpoint)
      .then((data) => {
        if (!cancelled) {
          setReport(data as AdminTreasuryReport);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to fetch treasury report");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTerm]);

  const stats = useMemo(() => {
    const memberships = report?.memberships ?? [];
    const registrations = report?.registrations ?? [];

    const membershipPaid = memberships
      .filter((m) => m.payment_status === "paid")
      .reduce((sum, m) => sum + m.amount, 0);
    const membershipRefunded = memberships
      .filter((m) => m.payment_status === "refunded")
      .reduce((sum, m) => sum + m.amount, 0);
    const membershipOutstanding = memberships
      .filter((m) => m.payment_status === "unpaid")
      .reduce((sum, m) => sum + m.amount, 0);

    const registrationPaid = registrations
      .filter((r) => r.payment_status === "paid")
      .reduce((sum, r) => sum + r.quoted_price, 0);
    const registrationRefunded = registrations
      .filter((r) => r.payment_status === "refunded")
      .reduce((sum, r) => sum + r.quoted_price, 0);
    const registrationOutstanding = registrations
      .filter((r) => r.payment_required && r.payment_status === "unpaid")
      .reduce((sum, r) => sum + r.quoted_price, 0);

    const gross = membershipPaid + registrationPaid;
    const refunded = membershipRefunded + registrationRefunded;
    const outstanding = membershipOutstanding + registrationOutstanding;

    return {
      membershipPaid,
      registrationPaid,
      gross,
      refunded,
      net: gross - refunded,
      outstanding,
    };
  }, [report]);

  const planBreakdown = useMemo(() => {
    const groups = new Map<string, { count: number; total: number }>();
    for (const payment of report?.memberships ?? []) {
      if (payment.payment_status !== "paid") {
        continue;
      }
      const group = groups.get(payment.plan) ?? { count: 0, total: 0 };
      group.count += 1;
      group.total += payment.amount;
      groups.set(payment.plan, group);
    }
    return Array.from(groups.entries()).map(([plan, value]) => ({
      plan,
      ...value,
    }));
  }, [report]);

  const eventBreakdown = useMemo(() => {
    const groups = new Map<
      number,
      {
        eventId: number;
        title: string;
        date: string | null;
        paidCount: number;
        gross: number;
        refunded: number;
        outstanding: number;
      }
    >();
    for (const registration of report?.registrations ?? []) {
      if (!registration.payment_required) {
        continue;
      }
      const eventId = registration.event_id;
      const group = groups.get(eventId) ?? {
        eventId,
        title: registration.event?.title ?? `Event #${eventId}`,
        date: registration.event?.date ?? null,
        paidCount: 0,
        gross: 0,
        refunded: 0,
        outstanding: 0,
      };
      if (registration.payment_status === "paid") {
        group.paidCount += 1;
        group.gross += registration.quoted_price;
      } else if (registration.payment_status === "refunded") {
        group.refunded += registration.quoted_price;
      } else if (registration.payment_status === "unpaid") {
        group.outstanding += registration.quoted_price;
      }
      groups.set(eventId, group);
    }
    return Array.from(groups.values()).sort((a, b) =>
      (b.date ?? "").localeCompare(a.date ?? ""),
    );
  }, [report]);

  if (loading || !report) {
    return <p className="text-sm text-muted-foreground">Loading treasury...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Treasury</h3>
          <p className="text-xs text-muted-foreground">
            Income summary {selectedTerm === "all" ? "across all terms" : `for ${selectedTerm}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : null}
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All terms</SelectItem>
              {report.terms.map((term) => (
                <SelectItem key={term} value={term}>
                  {term}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          label="Gross income"
          value={formatMoney(stats.gross)}
          subLabel={`Memberships ${formatMoney(stats.membershipPaid)} · Events ${formatMoney(stats.registrationPaid)}`}
        />
        <OverviewCard label="Refunded" value={formatMoney(stats.refunded)} />
        <OverviewCard label="Net income" value={formatMoney(stats.net)} />
        <OverviewCard label="Outstanding" value={formatMoney(stats.outstanding)} subLabel="Unpaid memberships and registrations" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Membership income by plan
          </h4>
          {planBreakdown.length > 0 ? (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Paid members</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planBreakdown.map((row) => (
                    <TableRow key={row.plan}>
                      <TableCell>{formatPlan(row.plan)}</TableCell>
                      <TableCell>{row.count}</TableCell>
                      <TableCell>{formatMoney(row.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No paid memberships in this period.</p>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Event income
          </h4>
          {eventBreakdown.length > 0 ? (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Refunded</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventBreakdown.map((row) => (
                    <TableRow key={row.eventId}>
                      <TableCell>
                        <p className="font-medium">{row.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDateOnly(row.date)}</p>
                      </TableCell>
                      <TableCell>{row.paidCount}</TableCell>
                      <TableCell>{formatMoney(row.gross)}</TableCell>
                      <TableCell>{formatMoney(row.refunded)}</TableCell>
                      <TableCell>{formatMoney(row.gross - row.refunded)}</TableCell>
                      <TableCell>{formatMoney(row.outstanding)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No paid event registrations in this period.</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Income
        </h4>
        <AdminDataTable
          columns={incomeColumns}
          rows={report.income}
          rowKey={(row) => row.id}
          csvFileName={`treasury-income-${selectedTerm === "all" ? "all-terms" : selectedTerm}.csv`}
          defaultSortColumnId="date"
          emptyMessage="No payments matched the current filters."
        />
      </div>
    </div>
  );
};
