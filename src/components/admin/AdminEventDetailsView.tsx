import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronUp, Columns3, Filter, GripHorizontal, ListFilter, Table2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import {
  AdminEventDetail as AdminEventDetailType,
  AdminEventFormField,
  AdminEventRegistration,
  getPaymentLabel,
} from "./types";
import { AdminRegistrationSnapshotDialog } from "./AdminRegistrationSnapshotDialog";
import {
  AdminDataTable,
  type AdminDataColumnFilterMode,
  type AdminDataColumnFilterOption,
} from "./AdminDataTable";

type AdminEventDetailProps = {
  eventId: number;
  onBack: () => void;
};

type ViewMode = "grouped" | "table";
type SortDirection = "asc" | "desc";
type RegistrationStatus = "pending" | "confirmed" | "cancelled" | "waitlisted";

const ACTIONS_COLUMN_ID = "participation_actions";
const STATUS_COLUMN_ID = "participation_status";
const REGISTRATION_STATUS_OPTIONS: RegistrationStatus[] = ["pending", "confirmed", "cancelled", "waitlisted"];

type ParticipantRow = {
  registration: AdminEventRegistration;
  displayName: string;
  answerMap: Record<string, string>;
  currentStatus: RegistrationStatus;
};

type TableColumn = {
  id: string;
  label: string;
  fullLabel?: string;
  getSearchValue: (row: ParticipantRow) => string;
  getSortValue: (row: ParticipantRow) => string;
  getDisplayValue: (row: ParticipantRow) => string;
  renderCell?: (row: ParticipantRow) => React.ReactNode;
  filterMode?: AdminDataColumnFilterMode;
  filterOptions?: AdminDataColumnFilterOption[];
  headerClassName?: string;
  cellClassName?: string;
  placeholder?: string;
};

type RegistrationStatusUpdateResult = {
  id: string;
  status: RegistrationStatus;
  updated_at: string | null;
};

const truncateLabel = (value: string, max = 56) => {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
};

const isDynamicColumn = (columnId: string) => columnId.startsWith("field:");
const ensurePinnedColumnsFirst = (columnIds: string[]) => {
  const withoutPinned = columnIds.filter((id) => id !== ACTIONS_COLUMN_ID && id !== STATUS_COLUMN_ID);
  return [ACTIONS_COLUMN_ID, STATUS_COLUMN_ID, ...withoutPinned];
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
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

const formatDateOnly = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const normalizeText = (value?: string | null) => (value ?? "").toLowerCase().trim();

const formatStatusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);
const escapeCsvValue = (value: string) => `"${value.replace(/"/g, '""')}"`;

// ── Payment badge (separate from the admin seat-tracker `status`) ───────────
// Color coding: Paid = green, Awaiting payment = amber, Failed = red,
// Refunded = purple, Free (no payment required) = slate.
const getPaymentInfo = (
  registration: AdminEventRegistration,
): { label: string; badgeClassName: string; rank: number } => {
  const label = getPaymentLabel(registration);
  const badgeClassName =
    label === "Paid"
      ? "border-green-600/30 bg-green-100 text-green-800 dark:border-green-500/30 dark:bg-green-950/50 dark:text-green-300"
      : label === "Refunded"
        ? "border-purple-500/30 bg-purple-100 text-purple-800 dark:border-purple-500/30 dark:bg-purple-950/50 dark:text-purple-300"
        : label === "Failed"
          ? "border-red-500/30 bg-red-100 text-red-800 dark:border-red-500/30 dark:bg-red-950/50 dark:text-red-300"
          : label === "Free"
            ? "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
            : "border-amber-500/30 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-300";
  const rank =
    label === "Free" ? 0 : label === "Paid" ? 1 : label === "Refunded" ? 2 : label === "Failed" ? 3 : 4;
  return { label, badgeClassName, rank };
};

const PaymentBadge = ({ registration }: { registration: AdminEventRegistration }) => {
  const { label, badgeClassName } = getPaymentInfo(registration);
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClassName}`}
    >
      {label}
    </span>
  );
};

const getAnswerValue = (registration: AdminEventRegistration, fieldId: string) => {
  const answer = registration.answers.find((item) => item.field_id === fieldId);
  if (!answer) {
    return "—";
  }

  if (Array.isArray(answer.answer_payload) && answer.answer_payload.length > 0) {
    return answer.answer_payload.join(", ");
  }

  if (typeof answer.answer_payload === "string") {
    return answer.answer_payload || "—";
  }

  return "—";
};

const buildParticipantRows = (
  event: AdminEventDetailType,
  statusDrafts: Record<string, RegistrationStatus>
): ParticipantRow[] =>
  event.registrations.map((registration) => {
    const profile = registration.profile;
    const linkedUser = registration.linked_user;
    const displayName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "Unnamed participant";
    const currentStatus = statusDrafts[registration.id] || (registration.status as RegistrationStatus);

    return {
      registration,
      displayName,
      currentStatus,
      answerMap: Object.fromEntries(
        event.form_fields.map((field) => [field.id, getAnswerValue(registration, field.id)])
      ),
    };
  });

const buildBaseColumns = (): TableColumn[] => [
  {
    id: ACTIONS_COLUMN_ID,
    label: "",
    getSearchValue: () => "",
    getSortValue: () => "",
    getDisplayValue: () => "",
    placeholder: "",
  },
  {
    id: "participation_status",
    label: "Status",
    getSearchValue: (row) => row.currentStatus,
    getSortValue: (row) => row.currentStatus,
    getDisplayValue: (row) => row.currentStatus,
    filterOptions: REGISTRATION_STATUS_OPTIONS.map((status) => ({
      label: formatStatusLabel(status),
      value: status,
    })),
  },
  {
    id: "payment",
    label: "Payment",
    getSearchValue: (row) => getPaymentInfo(row.registration).label,
    getSortValue: (row) => String(getPaymentInfo(row.registration).rank),
    getDisplayValue: (row) => getPaymentInfo(row.registration).label,
    renderCell: (row) => <PaymentBadge registration={row.registration} />,
    filterOptions: [
      { label: "Free", value: "free" },
      { label: "Paid", value: "paid" },
      { label: "Awaiting payment", value: "awaiting payment" },
      { label: "Failed", value: "failed" },
      { label: "Refunded", value: "refunded" },
    ],
  },
  {
    id: "participant",
    label: "Participant",
    getSearchValue: (row) => row.displayName,
    getSortValue: (row) => row.displayName,
    getDisplayValue: (row) => row.displayName,
    filterMode: "contains",
    placeholder: "Search name",
  },
  {
    id: "email",
    label: "Email",
    getSearchValue: (row) => row.registration.profile?.email || row.registration.linked_user?.email || "",
    getSortValue: (row) => row.registration.profile?.email || row.registration.linked_user?.email || "",
    getDisplayValue: (row) => row.registration.profile?.email || row.registration.linked_user?.email || "—",
    filterMode: "contains",
    placeholder: "Search email",
  },
  {
    id: "phone",
    label: "Phone",
    getSearchValue: (row) => row.registration.profile?.phone_number || row.registration.linked_user?.phone_number || "",
    getSortValue: (row) => row.registration.profile?.phone_number || row.registration.linked_user?.phone_number || "",
    getDisplayValue: (row) => row.registration.profile?.phone_number || row.registration.linked_user?.phone_number || "—",
    filterMode: "contains",
    placeholder: "Search phone",
  },
  {
    id: "student",
    label: "Student",
    getSearchValue: (row) => (row.registration.profile ? (row.registration.profile.is_student ? "yes" : "no") : ""),
    getSortValue: (row) => (row.registration.profile ? (row.registration.profile.is_student ? "1" : "0") : ""),
    getDisplayValue: (row) => (row.registration.profile ? (row.registration.profile.is_student ? "Yes" : "No") : "—"),
    filterOptions: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
  {
    id: "alumnus",
    label: "Alumnus",
    getSearchValue: (row) => (row.registration.profile ? (row.registration.profile.is_alumnus ? "yes" : "no") : ""),
    getSortValue: (row) => (row.registration.profile ? (row.registration.profile.is_alumnus ? "1" : "0") : ""),
    getDisplayValue: (row) => (row.registration.profile ? (row.registration.profile.is_alumnus ? "Yes" : "No") : "—"),
    filterOptions: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
  {
    id: "university",
    label: "University",
    getSearchValue: (row) => row.registration.profile?.university_name || "",
    getSortValue: (row) => row.registration.profile?.university_name || "",
    getDisplayValue: (row) => row.registration.profile?.university_name || "—",
    filterMode: "contains",
    placeholder: "Search university",
  },
  {
    id: "study_program",
    label: "Study Program",
    getSearchValue: (row) => row.registration.profile?.study_program || "",
    getSortValue: (row) => row.registration.profile?.study_program || "",
    getDisplayValue: (row) => row.registration.profile?.study_program || "—",
    filterMode: "contains",
    placeholder: "Search program",
  },
  {
    id: "gender",
    label: "Gender",
    getSearchValue: (row) => row.registration.profile?.gender || row.registration.linked_user?.gender || "",
    getSortValue: (row) => row.registration.profile?.gender || row.registration.linked_user?.gender || "",
    getDisplayValue: (row) => formatGender(row.registration.profile?.gender || row.registration.linked_user?.gender || null),
    filterOptions: [
      { label: "Male", value: "male" },
      { label: "Female", value: "female" },
    ],
  },
  {
    id: "submitted",
    label: "Submitted",
    getSearchValue: (row) => row.registration.submitted_at || "",
    getSortValue: (row) => row.registration.submitted_at || "",
    getDisplayValue: (row) => formatDateTime(row.registration.submitted_at),
    filterMode: "contains",
    placeholder: "Search date",
  },
  {
    id: "linked_user",
    label: "Linked User",
    getSearchValue: (row) =>
      row.registration.linked_user
        ? `${row.registration.linked_user.first_name} ${row.registration.linked_user.last_name}`
        : "guest",
    getSortValue: (row) =>
      row.registration.linked_user
        ? `${row.registration.linked_user.first_name} ${row.registration.linked_user.last_name}`
        : "guest",
    getDisplayValue: (row) =>
      row.registration.linked_user
        ? `${row.registration.linked_user.first_name} ${row.registration.linked_user.last_name}`.trim()
        : "Guest",
    filterMode: "contains",
    placeholder: "Search linked user",
  },
];

const getRowStatusTint = (status?: string) => {
  const normalized = normalizeText(status);
  if (normalized === "confirmed") {
    return "bg-emerald-100/85 hover:bg-emerald-200/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/45";
  }
  if (normalized === "cancelled") {
    return "bg-rose-100/85 hover:bg-rose-200/80 dark:bg-rose-950/40 dark:hover:bg-rose-900/45";
  }
  if (normalized === "waitlisted") {
    return "bg-amber-100/90 hover:bg-amber-200/85 dark:bg-amber-950/45 dark:hover:bg-amber-900/50";
  }
  return "";
};

const getDynamicStatusTint = (status?: string) => {
  const normalized = normalizeText(status);
  if (normalized === "confirmed") {
    return "bg-emerald-200/40 dark:bg-emerald-900/28";
  }
  if (normalized === "cancelled") {
    return "bg-rose-200/40 dark:bg-rose-900/28";
  }
  if (normalized === "waitlisted") {
    return "bg-amber-200/45 dark:bg-amber-900/32";
  }
  return "bg-slate-100/35 dark:bg-slate-800/20";
};

const buildDynamicColumns = (fields: AdminEventFormField[]): TableColumn[] =>
  fields.map((field, index) => ({
    id: `field:${field.id}`,
    label: `Q${index + 1}`,
    fullLabel: field.question,
    getSearchValue: (row) => row.answerMap[field.id] || "",
    getSortValue: (row) => row.answerMap[field.id] || "",
    getDisplayValue: (row) => row.answerMap[field.id] || "—",
    filterMode: "contains",
    placeholder: "Search answer",
  }));

const AdminGroupedParticipantCard = ({
  registration,
  fields,
  statusOverride,
  onRequestDelete,
  deletingRegistrationId,
}: {
  registration: AdminEventRegistration;
  fields: AdminEventFormField[];
  statusOverride?: string;
  onRequestDelete: (registration: AdminEventRegistration) => void;
  deletingRegistrationId: string | null;
}) => {
  const profile = registration.profile;
  const displayName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "Unnamed participant";
  const linkedUser = registration.linked_user;
  const status = statusOverride || registration.status;

  return (
    <AccordionItem value={registration.id}>
      <AccordionTrigger className="gap-4 text-left no-underline hover:no-underline">
        <div className="flex w-full flex-col gap-1 text-left md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">{displayName}</p>
            <p className="text-xs text-muted-foreground">{profile?.email || linkedUser?.email || "No email stored"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border px-2 py-1 uppercase tracking-wide text-muted-foreground">
              {status}
            </span>
            <PaymentBadge registration={registration} />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-7 px-2"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onRequestDelete(registration);
              }}
              disabled={deletingRegistrationId === registration.id}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-6 rounded-lg border border-border bg-background/60 p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Complete participant information</p>
            <AdminRegistrationSnapshotDialog registration={registration} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Identity</p>
              <p>Name: {displayName}</p>
              <p>Email: {profile?.email || linkedUser?.email || "—"}</p>
              <p>Phone: {profile?.phone_number || linkedUser?.phone_number || "—"}</p>
              <p>Gender: {formatGender(profile?.gender || linkedUser?.gender || null)}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Academic</p>
              <p>Student: {profile ? (profile.is_student ? "Yes" : "No") : "—"}</p>
              <p>Alumnus: {profile ? (profile.is_alumnus ? "Yes" : "No") : "—"}</p>
              <p>University: {profile?.university_name || "—"}</p>
              <p>Study program: {profile?.study_program || "—"}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Registration</p>
              <p>Status: {status}</p>
              <p>Submitted: {formatDateTime(registration.submitted_at)}</p>
              <p>Updated: {formatDateTime(registration.updated_at)}</p>
              <p>Quoted price: {registration.quoted_price} SEK</p>
              <p>Payment: {getPaymentInfo(registration).label}</p>
              {registration.payment_completed_at && (
                <p>Paid at: {formatDateTime(registration.payment_completed_at)}</p>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Linked account</p>
              <p>Linked user: {linkedUser ? `${linkedUser.first_name} ${linkedUser.last_name}`.trim() : "Guest"}</p>
              <p>Linked email: {linkedUser?.email || "—"}</p>
              <p>Linked phone: {linkedUser?.phone_number || "—"}</p>
              <p>Linked role: {linkedUser?.role || "—"}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dynamic form answers</p>
            {fields.length > 0 ? (
              <div className="overflow-hidden rounded-md border">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30%]">Question</TableHead>
                        <TableHead className="w-[50%]">Answer</TableHead>
                        <TableHead className="w-[10%]">Type</TableHead>
                        <TableHead className="w-[10%]">Required</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field) => (
                        <TableRow key={field.id}>
                          <TableCell className="align-top font-medium">
                            <div className="space-y-1">
                              <p>{field.question}</p>
                              {field.help_text && (
                                <p className="text-xs font-normal text-muted-foreground">{field.help_text}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-top whitespace-pre-wrap">{getAnswerValue(registration, field.id)}</TableCell>
                          <TableCell className="align-top text-sm text-muted-foreground">{field.field_type}</TableCell>
                          <TableCell className="align-top text-sm text-muted-foreground">{field.is_required ? "Yes" : "No"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No dynamic fields configured for this event.</p>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export const AdminEventDetailView = ({ eventId, onBack }: AdminEventDetailProps) => {
  const navigate = useNavigate();
  const [event, setEvent] = useState<AdminEventDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [statusDrafts, setStatusDrafts] = useState<Record<string, RegistrationStatus>>({});
  const [savingStatuses, setSavingStatuses] = useState(false);
  const [deleteTargetRegistration, setDeleteTargetRegistration] = useState<AdminEventRegistration | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<1 | 2>(1);
  const [deletingRegistrationId, setDeletingRegistrationId] = useState<string | null>(null);
  const [updatingPublishState, setUpdatingPublishState] = useState(false);
  const [unpublishConfirmOpen, setUnpublishConfirmOpen] = useState(false);
  const [updatingOpenState, setUpdatingOpenState] = useState(false);
  const [closingRegistration, setClosingRegistration] = useState(false);
  const [closeRegistrationConfirmOpen, setCloseRegistrationConfirmOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setViewMode("table");
    setStatusDrafts({});

    const fetchEvent = async () => {
      try {
        const data = await apiRequest(`/admin/events/${eventId}`);
        if (isMounted) {
          setEvent(data);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to fetch event details");
        if (error.message?.includes("Access denied")) {
          onBack();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEvent();

    return () => {
      isMounted = false;
    };
  }, [eventId, onBack]);

  const requestRegistrationDelete = (registration: AdminEventRegistration) => {
    setDeleteTargetRegistration(registration);
    setDeleteConfirmStep(1);
  };

  const handleStatusChange = (registrationId: string, nextStatus: RegistrationStatus, originalStatus: RegistrationStatus) => {
    setStatusDrafts((previous) => {
      const next = { ...previous };
      if (nextStatus === originalStatus) {
        delete next[registrationId];
      } else {
        next[registrationId] = nextStatus;
      }
      return next;
    });
  };

  const columns = useMemo(() => {
    if (!event) {
      return [] as TableColumn[];
    }

    const base = [...buildBaseColumns(), ...buildDynamicColumns(event.form_fields || [])];
    return base.map((column) => {
      if (column.id === ACTIONS_COLUMN_ID) {
        return {
          ...column,
          renderCell: (row: ParticipantRow) => (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={() => requestRegistrationDelete(row.registration)}
              disabled={deletingRegistrationId === row.registration.id}
              title="Delete registration"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ),
          headerClassName: "w-[52px] min-w-[52px] max-w-[52px]",
        };
      }

      if (column.id === STATUS_COLUMN_ID) {
        return {
          ...column,
          renderCell: (row: ParticipantRow) => (
            <Select
              value={row.currentStatus}
              onValueChange={(value) =>
                handleStatusChange(
                  row.registration.id,
                  value as RegistrationStatus,
                  row.registration.status as RegistrationStatus,
                )
              }
            >
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {REGISTRATION_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ),
        };
      }

      return column;
    });
  }, [event, deletingRegistrationId, statusDrafts]);

  const participantRows = useMemo(() => {
    if (!event) {
      return [] as ParticipantRow[];
    }
    return buildParticipantRows(event, statusDrafts);
  }, [event, statusDrafts]);

  const pendingStatusUpdateCount = Object.keys(statusDrafts).length;
  const requiresExtraDeleteConfirmation = deleteTargetRegistration?.status === "confirmed";

  const saveStatusChanges = async () => {
    if (!event || pendingStatusUpdateCount === 0) {
      return;
    }

    const updates = Object.entries(statusDrafts).map(([registration_id, status]) => ({
      registration_id,
      status,
    }));

    setSavingStatuses(true);
    try {
      const response = (await apiRequest(`/admin/events/${event.id}/registrations/status`, "PATCH", { updates })) as {
        registrations?: RegistrationStatusUpdateResult[];
      };
      const updatedRegistrations = new Map(
        (response?.registrations || []).map((registration: { id: string; status: RegistrationStatus; updated_at: string | null }) => [
          registration.id,
          registration,
        ])
      );

      setEvent((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          registrations: previous.registrations.map((registration) => {
            const updated = updatedRegistrations.get(registration.id);
            if (!updated) {
              return registration;
            }

            return {
              ...registration,
              status: updated.status,
              updated_at: updated.updated_at,
            };
          }),
        };
      });

      setStatusDrafts({});
      toast.success(`Updated ${updates.length} participant status${updates.length === 1 ? "" : "es"}.`);
    } catch (error: any) {
      toast.error(error.message || "Failed to save participant statuses");
    } finally {
      setSavingStatuses(false);
    }
  };

  const setPublishState = async (nextIsPublished: boolean) => {
    if (!event || event.is_published === nextIsPublished) {
      return;
    }

    setUpdatingPublishState(true);
    try {
      const response = await apiRequest(`/admin/events/${event.id}/publish-state`, "PATCH", { is_published: nextIsPublished }) as {
        event?: { is_published?: boolean };
      };

      if (response?.event?.is_published === nextIsPublished) {
        setEvent((previous) => (previous ? { ...previous, is_published: nextIsPublished } : previous));
      }

      toast.success(nextIsPublished ? "Event published." : "Event unpublished.");
    } catch (error: any) {
      toast.error(error.message || `Failed to ${nextIsPublished ? "publish" : "unpublish"} event`);
    } finally {
      setUpdatingPublishState(false);
    }
  };

  // Flips whether the event is open for signups ("coming soon" mode on the
  // public Events page). Independent of publish state and registration
  // deadline — it only gates new signups.
  const setOpenState = async (nextIsOpen: boolean) => {
    if (!event || event.is_open === nextIsOpen) {
      return;
    }

    setUpdatingOpenState(true);
    try {
      const response = await apiRequest(`/admin/events/${event.id}/open-state`, "PATCH", { is_open: nextIsOpen }) as {
        event?: { is_open?: boolean };
      };

      if (response?.event?.is_open === nextIsOpen) {
        setEvent((previous) => (previous ? { ...previous, is_open: nextIsOpen } : previous));
      }

      toast.success(nextIsOpen ? "Event opened for signups." : "Event closed for signups.");
    } catch (error: any) {
      toast.error(error.message || `Failed to ${nextIsOpen ? "open" : "close"} signups`);
    } finally {
      setUpdatingOpenState(false);
    }
  };

  // Sets the registration deadline to right now — no new registrations can be
  // submitted after that. Existing registrations and pending payments are
  // unaffected.
  const closeRegistration = async () => {
    if (!event) {
      return;
    }

    setClosingRegistration(true);
    try {
      const now = new Date().toISOString();
      await apiRequest(`/admin/events/${event.id}`, "PATCH", { deadline: now });
      setEvent((previous) => (previous ? { ...previous, deadline: now } : previous));
      setCloseRegistrationConfirmOpen(false);
      toast.success("Registration closed.");
    } catch (error: any) {
      toast.error(error.message || "Failed to close registration");
    } finally {
      setClosingRegistration(false);
    }
  };

  const confirmDeleteRegistration = async () => {
    if (!event || !deleteTargetRegistration) {
      return;
    }

    const registrationId = deleteTargetRegistration.id;
    setDeletingRegistrationId(registrationId);
    try {
      await apiRequest(`/admin/events/${event.id}/registrations/${registrationId}`, "DELETE");

      setEvent((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          registrations: previous.registrations.filter((registration) => registration.id !== registrationId),
        };
      });

      setStatusDrafts((previous) => {
        if (!previous[registrationId]) {
          return previous;
        }
        const next = { ...previous };
        delete next[registrationId];
        return next;
      });

      setDeleteTargetRegistration(null);
      toast.success("Registration deleted successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete registration");
    } finally {
      setDeletingRegistrationId(null);
    }
  };

  // Table machinery (sorting, filtering, column reorder, CSV) now lives in
  // the shared AdminDataTable component.

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading event details...</p>;
  }

  if (!event) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="px-0 hover:bg-transparent">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to events
        </Button>
        <p className="text-sm text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  const fields = event.form_fields ?? [];
  const participantCount = event.registrations.length;
  const registrationAlreadyClosed = new Date(event.deadline).getTime() <= Date.now();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack} className="px-0 hover:bg-transparent">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to events
        </Button>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-1">
          <Button
            type="button"
            variant={viewMode === "grouped" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grouped")}
          >
            <ListFilter className="mr-2 h-4 w-4" />
            Grouped view
          </Button>
          <Button
            type="button"
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <Table2 className="mr-2 h-4 w-4" />
            Table view
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{event.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDateOnly(event.date)} · {event.start_time} - {event.end_time} · {event.address}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={event.is_published === false ? "rounded-full border border-red-200 bg-red-50 px-2 py-1 text-red-700" : "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700"}>
                {event.is_published === false ? "Draft" : "Published"}
              </span>
              <span className={event.is_open === false ? "rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700" : "rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-sky-700"}>
                {event.is_open === false ? "Signups closed" : "Signups open"}
              </span>
              <span className="rounded-full border px-2 py-1 text-muted-foreground">{participantCount} registered</span>
              <span className="rounded-full border px-2 py-1 text-muted-foreground">{event.invitation}</span>
              <span className="rounded-full border px-2 py-1 text-muted-foreground">{event.siblings}</span>
            </div>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
            <p><span className="text-muted-foreground">Deadline:</span> {formatDateTime(event.deadline)}</p>
            <p><span className="text-muted-foreground">Member price:</span> {event.price_member} SEK</p>
            <p><span className="text-muted-foreground">Non-member price:</span> {event.price_nonmember} SEK</p>
            <p><span className="text-muted-foreground">Alumnus price:</span> {event.price_alumnus} SEK</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {viewMode === "grouped" ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Registered participants</h4>
              {participantCount > 0 ? (
                <Accordion type="multiple" className="w-full rounded-lg border px-4">
                  {event.registrations.map((registration) => (
                    <AdminGroupedParticipantCard
                      key={registration.id}
                      registration={registration}
                      fields={fields}
                      statusOverride={statusDrafts[registration.id]}
                      onRequestDelete={requestRegistrationDelete}
                      deletingRegistrationId={deletingRegistrationId}
                    />
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground">No registered participants yet.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <AdminDataTable
                columns={columns}
                rows={participantRows}
                rowKey={(row) => row.registration.id}
                csvFileName={`${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-participants.csv`}
                pinnedColumnIds={[ACTIONS_COLUMN_ID, STATUS_COLUMN_ID]}
                defaultSortColumnId="participant"
                getRowTint={(row) => getRowStatusTint(row.currentStatus)}
              />

              {pendingStatusUpdateCount > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Status edits are staged locally until you save them.
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant={event.is_published === false ? "default" : "destructive"}
                    size="sm"
                    disabled={updatingPublishState}
                    onClick={() => {
                      if (event.is_published === false) {
                        void setPublishState(true);
                        return;
                      }

                      setUnpublishConfirmOpen(true);
                    }}
                  >
                    {updatingPublishState
                      ? (event.is_published === false ? "Publishing..." : "Unpublishing...")
                      : (event.is_published === false ? "Publish event" : "Unpublish")}
                  </Button>
                  {event.is_published === false ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/events/${event.id}/edit`)}
                    >
                      Edit draft
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={updatingOpenState}
                    onClick={() => void setOpenState(event.is_open === false)}
                    className={
                      event.is_open === false
                        ? "border-emerald-600/60 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30"
                        : "border-amber-500/60 text-amber-700 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30"
                    }
                  >
                    {updatingOpenState
                      ? (event.is_open === false ? "Opening signups..." : "Closing signups...")
                      : (event.is_open === false ? "Open signups" : "Close signups")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={closingRegistration || registrationAlreadyClosed}
                    onClick={() => setCloseRegistrationConfirmOpen(true)}
                    className={
                      registrationAlreadyClosed
                        ? "border-border text-muted-foreground bg-muted/50 hover:bg-muted/50 opacity-80"
                        : "border-red-600/50 text-red-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-accent-foreground"
                    }
                  >
                    {closingRegistration
                      ? "Closing..."
                      : registrationAlreadyClosed
                        ? "Registration closed"
                        : "Close registration"}
                  </Button>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {pendingStatusUpdateCount > 0 ? (
                    <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                      {pendingStatusUpdateCount} unsaved change{pendingStatusUpdateCount === 1 ? "" : "s"}
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={pendingStatusUpdateCount === 0 || savingStatuses}
                    onClick={saveStatusChanges}
                  >
                    {savingStatuses ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(deleteTargetRegistration)}
        onOpenChange={(open) => {
          if (!open && !deletingRegistrationId) {
            setDeleteTargetRegistration(null);
            setDeleteConfirmStep(1);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {requiresExtraDeleteConfirmation && deleteConfirmStep === 2
                ? "Registration is currently confirmed"
                : "Permanently delete registration?"}
            </AlertDialogTitle>
            {requiresExtraDeleteConfirmation && deleteConfirmStep === 2 ? (
              <AlertDialogDescription>
                This participant is currently marked as confirmed. Continue only if you intentionally want to permanently delete this registration.
              </AlertDialogDescription>
            ) : (
              <AlertDialogDescription>
                This action is NOT undoable. Consider changing the status of the participant to "cancelled" instead.
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingRegistrationId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (requiresExtraDeleteConfirmation && deleteConfirmStep === 1) {
                  setDeleteConfirmStep(2);
                  return;
                }
                void confirmDeleteRegistration();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={Boolean(deletingRegistrationId)}
            >
              {deletingRegistrationId ? "Deleting..." : requiresExtraDeleteConfirmation && deleteConfirmStep === 1 ? "Continue" : "Delete registration"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={unpublishConfirmOpen}
        onOpenChange={setUnpublishConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the event from public listings. Existing registrations will remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingPublishState}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                setUnpublishConfirmOpen(false);
                void setPublishState(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={updatingPublishState}
            >
              {updatingPublishState ? "Unpublishing..." : "Unpublish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={closeRegistrationConfirmOpen}
        onOpenChange={(open) => {
          if (!closingRegistration) {
            setCloseRegistrationConfirmOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close registration?</AlertDialogTitle>
            <AlertDialogDescription>
              The registration deadline will be set to right now, so no new
              registrations can be submitted. Existing registrations and
              pending payments are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closingRegistration}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void closeRegistration();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={closingRegistration}
            >
              {closingRegistration ? "Closing..." : "Close registration"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
