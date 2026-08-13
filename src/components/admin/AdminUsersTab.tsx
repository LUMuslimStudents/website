import { useMemo } from "react";

import { AdminDataTable, type AdminDataColumn } from "./AdminDataTable";
import { AdminUser } from "./types";

const formatDateOnly = (value?: string | null) => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const formatGender = (value?: string | null) => {
  if (!value) {
    return "—";
  }
  const gender = value.toLowerCase().trim();
  if (gender === "male" || gender === "m") {
    return "male 🧔🏻‍♂️";
  }
  if (gender === "female" || gender === "f") {
    return "female 🧕🏻";
  }
  return value;
};

type AdminUsersTabProps = {
  users: AdminUser[];
  loading: boolean;
};

export const AdminUsersTab = ({ users, loading }: AdminUsersTabProps) => {
  const columns = useMemo<AdminDataColumn<AdminUser>[]>(() => [
    {
      id: "name",
      label: "Name",
      getSearchValue: (user) => `${user.first_name} ${user.last_name}`,
      getSortValue: (user) => `${user.first_name} ${user.last_name}`,
      getDisplayValue: (user) => `${user.first_name} ${user.last_name}`.trim(),
      placeholder: "Search name",
    },
    {
      id: "email",
      label: "Email",
      getSearchValue: (user) => user.email ?? "",
      getSortValue: (user) => user.email ?? "",
      getDisplayValue: (user) => user.email ?? "—",
      placeholder: "Search email",
    },
    {
      id: "phone",
      label: "Phone",
      getSearchValue: (user) => user.phone_number ?? "",
      getSortValue: (user) => user.phone_number ?? "",
      getDisplayValue: (user) => user.phone_number ?? "—",
      placeholder: "Search phone",
    },
    {
      id: "gender",
      label: "Gender",
      getSearchValue: (user) => user.gender ?? "",
      getSortValue: (user) => user.gender ?? "",
      getDisplayValue: (user) => formatGender(user.gender),
      placeholder: "Search gender",
    },
    {
      id: "study_program",
      label: "Study Program",
      getSearchValue: (user) => user.study_program ?? "",
      getSortValue: (user) => user.study_program ?? "",
      getDisplayValue: (user) => user.study_program ?? "—",
      placeholder: "Search program",
    },
    {
      id: "term",
      label: "Term",
      getSearchValue: (user) => user.term ?? "",
      getSortValue: (user) => user.term ?? "",
      getDisplayValue: (user) => user.term ?? "—",
      placeholder: "Search term",
    },
    {
      id: "role",
      label: "Role",
      getSearchValue: (user) => user.role ?? "",
      getSortValue: (user) => user.role ?? "",
      getDisplayValue: (user) => user.role ?? "—",
      placeholder: "Search role",
    },
    {
      id: "membership_status",
      label: "Membership",
      getSearchValue: (user) => (user.membership_status === "paid" ? "paid" : "unpaid"),
      getSortValue: (user) => (user.membership_status === "paid" ? "1" : "0"),
      getDisplayValue: (user) => (user.membership_status === "paid" ? "Paid" : "Unpaid"),
      renderCell: (user) =>
        user.membership_status === "paid" ? (
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400">
            Paid
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-400">
            Unpaid
          </span>
        ),
      placeholder: "paid/unpaid",
    },
    {
      id: "membership_plan",
      label: "Plan",
      getSearchValue: (user) => user.membership_plan ?? "",
      getSortValue: (user) => user.membership_plan ?? "",
      getDisplayValue: (user) =>
        user.membership_plan === "two_term"
          ? "Two terms"
          : user.membership_plan === "single_term"
            ? "Single term"
            : "—",
      placeholder: "Search plan",
    },
    {
      id: "membership_paid_at",
      label: "Paid At",
      getSearchValue: (user) => user.membership_paid_at ?? "",
      getSortValue: (user) => user.membership_paid_at ?? "",
      getDisplayValue: (user) => formatDateOnly(user.membership_paid_at),
      placeholder: "Search date",
    },
    {
      id: "created_at",
      label: "Joined",
      getSearchValue: (user) => user.created_at ?? "",
      getSortValue: (user) => user.created_at ?? "",
      getDisplayValue: (user) => formatDateOnly(user.created_at),
      placeholder: "Search date",
    },
  ], []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading users...</p>;
  }

  if (users.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No users found.</p>;
  }

  return (
    <AdminDataTable
      columns={columns}
      rows={users}
      rowKey={(user) => user.id}
      csvFileName="lums-users.csv"
      defaultSortColumnId="name"
      emptyMessage="No users matched the current column filters."
    />
  );
};
