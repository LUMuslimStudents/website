import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronUp, Columns3, Filter, GripHorizontal, ListFilter, Table2, Trash2 } from "lucide-react";

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
} from "./types";
import { AdminRegistrationSnapshotDialog } from "./AdminRegistrationSnapshotDialog";

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
    placeholder: "confirmed/pending",
  },
  {
    id: "participant",
    label: "Participant",
    getSearchValue: (row) => row.displayName,
    getSortValue: (row) => row.displayName,
    getDisplayValue: (row) => row.displayName,
    placeholder: "Search name",
  },
  {
    id: "email",
    label: "Email",
    getSearchValue: (row) => row.registration.profile?.email || row.registration.linked_user?.email || "",
    getSortValue: (row) => row.registration.profile?.email || row.registration.linked_user?.email || "",
    getDisplayValue: (row) => row.registration.profile?.email || row.registration.linked_user?.email || "—",
    placeholder: "Search email",
  },
  {
    id: "phone",
    label: "Phone",
    getSearchValue: (row) => row.registration.profile?.phone_number || row.registration.linked_user?.phone_number || "",
    getSortValue: (row) => row.registration.profile?.phone_number || row.registration.linked_user?.phone_number || "",
    getDisplayValue: (row) => row.registration.profile?.phone_number || row.registration.linked_user?.phone_number || "—",
    placeholder: "Search phone",
  },
  {
    id: "student",
    label: "Student",
    getSearchValue: (row) => (row.registration.profile ? (row.registration.profile.is_student ? "yes" : "no") : ""),
    getSortValue: (row) => (row.registration.profile ? (row.registration.profile.is_student ? "1" : "0") : ""),
    getDisplayValue: (row) => (row.registration.profile ? (row.registration.profile.is_student ? "Yes" : "No") : "—"),
    placeholder: "yes/no",
  },
  {
    id: "alumnus",
    label: "Alumnus",
    getSearchValue: (row) => (row.registration.profile ? (row.registration.profile.is_alumnus ? "yes" : "no") : ""),
    getSortValue: (row) => (row.registration.profile ? (row.registration.profile.is_alumnus ? "1" : "0") : ""),
    getDisplayValue: (row) => (row.registration.profile ? (row.registration.profile.is_alumnus ? "Yes" : "No") : "—"),
    placeholder: "yes/no",
  },
  {
    id: "university",
    label: "University",
    getSearchValue: (row) => row.registration.profile?.university_name || "",
    getSortValue: (row) => row.registration.profile?.university_name || "",
    getDisplayValue: (row) => row.registration.profile?.university_name || "—",
    placeholder: "Search university",
  },
  {
    id: "study_program",
    label: "Study Program",
    getSearchValue: (row) => row.registration.profile?.study_program || "",
    getSortValue: (row) => row.registration.profile?.study_program || "",
    getDisplayValue: (row) => row.registration.profile?.study_program || "—",
    placeholder: "Search program",
  },
  {
    id: "gender",
    label: "Gender",
    getSearchValue: (row) => row.registration.profile?.gender || row.registration.linked_user?.gender || "",
    getSortValue: (row) => row.registration.profile?.gender || row.registration.linked_user?.gender || "",
    getDisplayValue: (row) => formatGender(row.registration.profile?.gender || row.registration.linked_user?.gender || null),
    placeholder: "Search gender",
  },
  {
    id: "submitted",
    label: "Submitted",
    getSearchValue: (row) => row.registration.submitted_at || "",
    getSortValue: (row) => row.registration.submitted_at || "",
    getDisplayValue: (row) => formatDateTime(row.registration.submitted_at),
    placeholder: "Search date",
  },
  {
    id: "payment_required",
    label: "Payment",
    getSearchValue: (row) => (row.registration.payment_required ? "required" : "not required"),
    getSortValue: (row) => (row.registration.payment_required ? "1" : "0"),
    getDisplayValue: (row) => (row.registration.payment_required ? "Required" : "Not required"),
    placeholder: "required/not",
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
            <span className="rounded-full border px-2 py-1 text-muted-foreground">
              {registration.payment_required ? "Payment required" : "No payment due"}
            </span>
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
              <p>Payment required: {registration.payment_required ? "Yes" : "No"}</p>
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
  const [event, setEvent] = useState<AdminEventDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sortColumnId, setSortColumnId] = useState<string>("participant");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>([]);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, RegistrationStatus>>({});
  const [savingStatuses, setSavingStatuses] = useState(false);
  const [deleteTargetRegistration, setDeleteTargetRegistration] = useState<AdminEventRegistration | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<1 | 2>(1);
  const [deletingRegistrationId, setDeletingRegistrationId] = useState<string | null>(null);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [dragHandleCenters, setDragHandleCenters] = useState<Record<string, number>>({});
  const tableViewportRef = useRef<HTMLDivElement | null>(null);
  const headerCellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setViewMode("table");
    setSortColumnId("participant");
    setSortDirection("asc");
    setColumnFilters({});
    setColumnOrder([]);
    setVisibleColumnIds([]);
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

  const allColumns = useMemo(() => {
    if (!event) {
      return [] as TableColumn[];
    }
    return [...buildBaseColumns(), ...buildDynamicColumns(event.form_fields || [])];
  }, [event]);

  useEffect(() => {
    if (allColumns.length === 0) {
      return;
    }

    const allIds = allColumns.map((column) => column.id);
    setColumnOrder((previous) => {
      if (previous.length === 0) {
        return ensurePinnedColumnsFirst(allIds);
      }

      const retained = previous.filter((id) => allIds.includes(id));
      const appended = allIds.filter((id) => !retained.includes(id));
      return ensurePinnedColumnsFirst([...retained, ...appended]);
    });
  }, [allColumns]);

  useEffect(() => {
    if (allColumns.length === 0) {
      return;
    }

    const allIds = allColumns.map((column) => column.id);
    setVisibleColumnIds((previous) => {
      if (previous.length === 0) {
        return ensurePinnedColumnsFirst(allIds);
      }

      const retained = previous.filter((id) => allIds.includes(id));
      const appended = allIds.filter((id) => !retained.includes(id));
      const next = [...retained, ...appended];
      return ensurePinnedColumnsFirst(next);
    });
  }, [allColumns]);

  const orderedColumns = useMemo(() => {
    if (allColumns.length === 0) {
      return [] as TableColumn[];
    }

    const map = new Map(allColumns.map((column) => [column.id, column]));
    return columnOrder.map((id) => map.get(id)).filter((column): column is TableColumn => Boolean(column));
  }, [allColumns, columnOrder]);

  const visibleOrderedColumns = useMemo(
    () => orderedColumns.filter((column) => visibleColumnIds.includes(column.id)),
    [orderedColumns, visibleColumnIds]
  );

  useEffect(() => {
    if (visibleOrderedColumns.length === 0) {
      return;
    }

    if (!visibleOrderedColumns.some((column) => column.id === sortColumnId)) {
      setSortColumnId(visibleOrderedColumns[0].id);
      setSortDirection("asc");
    }
  }, [visibleOrderedColumns, sortColumnId]);

  const participantRows = useMemo(() => {
    if (!event || visibleOrderedColumns.length === 0) {
      return [] as ParticipantRow[];
    }

    const rows = buildParticipantRows(event, statusDrafts);

    const filteredRows = rows.filter((row) =>
      visibleOrderedColumns.every((column) => {
        const filterValue = normalizeText(columnFilters[column.id]);
        if (!filterValue) {
          return true;
        }
        return normalizeText(column.getSearchValue(row)).includes(filterValue);
      })
    );

    const activeSortColumn = visibleOrderedColumns.find((column) => column.id === sortColumnId) || visibleOrderedColumns[0];

    return [...filteredRows].sort((left, right) => {
      const leftValue = normalizeText(activeSortColumn.getSortValue(left));
      const rightValue = normalizeText(activeSortColumn.getSortValue(right));
      const comparison = leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [columnFilters, event, statusDrafts, visibleOrderedColumns, sortColumnId, sortDirection]);

  const pendingStatusUpdateCount = Object.keys(statusDrafts).length;
  const requiresExtraDeleteConfirmation = deleteTargetRegistration?.status === "confirmed";

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

  const exportAsCsv = () => {
    if (!event || visibleOrderedColumns.length === 0) {
      return;
    }

    const headers = visibleOrderedColumns.map((column) => column.fullLabel || column.label);
    const rows = participantRows.map((row) =>
      visibleOrderedColumns.map((column) => {
        const rawValue = column.getDisplayValue(row);
        return escapeCsvValue(String(rawValue ?? ""));
      }).join(",")
    );

    const csvContent = [
      headers.map((header) => escapeCsvValue(header)).join(","),
      ...rows,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-participants.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleColumnVisibility = (columnId: string, nextChecked: boolean) => {
    if ((columnId === ACTIONS_COLUMN_ID || columnId === STATUS_COLUMN_ID) && !nextChecked) {
      return;
    }

    setVisibleColumnIds((previous) => {
      if (nextChecked) {
        if (previous.includes(columnId)) {
          return previous;
        }
        return ensurePinnedColumnsFirst([...previous, columnId]);
      }

      if (previous.length <= 1) {
        return previous;
      }

      return previous.filter((id) => id !== columnId);
    });
  };

  const moveColumnInOrder = (columnId: string, direction: "up" | "down") => {
    if (columnId === ACTIONS_COLUMN_ID || columnId === STATUS_COLUMN_ID) {
      return;
    }

    setColumnOrder((previous) => {
      const index = previous.indexOf(columnId);
      if (index === -1) {
        return previous;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= previous.length) {
        return previous;
      }

      const next = [...previous];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return ensurePinnedColumnsFirst(next);
    });
  };

  const handleSort = (columnId: string) => {
    if (sortColumnId === columnId) {
      setSortDirection((previous) => (previous === "asc" ? "desc" : "asc"));
      return;
    }

    setSortColumnId(columnId);
    setSortDirection("asc");
  };

  const handleColumnDrop = (targetColumnId: string) => {
    if (!draggedColumnId || draggedColumnId === targetColumnId) {
      return;
    }
    if (
      draggedColumnId === ACTIONS_COLUMN_ID ||
      targetColumnId === ACTIONS_COLUMN_ID ||
      draggedColumnId === STATUS_COLUMN_ID ||
      targetColumnId === STATUS_COLUMN_ID
    ) {
      setDraggedColumnId(null);
      return;
    }

    setColumnOrder((previous) => {
      const from = previous.indexOf(draggedColumnId);
      const to = previous.indexOf(targetColumnId);
      if (from === -1 || to === -1) {
        return previous;
      }

      const next = [...previous];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return ensurePinnedColumnsFirst(next);
    });
    setDraggedColumnId(null);
  };

  const handleLenientColumnDrop = (clientX: number) => {
    if (!draggedColumnId || visibleOrderedColumns.length === 0) {
      setDraggedColumnId(null);
      return;
    }

    const closest = visibleOrderedColumns
      .map((column) => {
        const node = headerCellRefs.current[column.id];
        if (!node) {
          return null;
        }

        const rect = node.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        return {
          id: column.id,
          distance: Math.abs(clientX - centerX),
        };
      })
      .filter((item): item is { id: string; distance: number } => Boolean(item))
      .sort((a, b) => a.distance - b.distance)[0];

    if (!closest) {
      setDraggedColumnId(null);
      return;
    }

    handleColumnDrop(closest.id);
  };

  const updateDragHandleCenters = () => {
    const viewportNode = tableViewportRef.current;
    if (!viewportNode || visibleOrderedColumns.length === 0) {
      return;
    }

    const viewportRect = viewportNode.getBoundingClientRect();
    const nextCenters: Record<string, number> = {};

    for (const column of visibleOrderedColumns) {
      const cellNode = headerCellRefs.current[column.id];
      if (!cellNode) {
        continue;
      }

      const cellRect = cellNode.getBoundingClientRect();
      nextCenters[column.id] = cellRect.left - viewportRect.left + cellRect.width / 2;
    }

    setDragHandleCenters(nextCenters);
  };

  useEffect(() => {
    updateDragHandleCenters();
  }, [visibleOrderedColumns, participantRows.length]);

  useEffect(() => {
    const handleResize = () => updateDragHandleCenters();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [visibleOrderedColumns]);

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
              <div className="flex justify-end">
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={exportAsCsv}>
                    Export as CSV
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="gap-2">
                        <Columns3 className="h-4 w-4" />
                        Columns
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="end" className="w-56 max-h-72 overflow-y-auto">
                      <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {orderedColumns
                        .filter((column) => column.id !== ACTIONS_COLUMN_ID && column.id !== STATUS_COLUMN_ID)
                        .map((column, index, dropdownColumns) => {
                      const isPinnedColumn = column.id === ACTIONS_COLUMN_ID || column.id === STATUS_COLUMN_ID;
                      const isVisible = isPinnedColumn ? true : visibleColumnIds.includes(column.id);
                      const disableToggle = isPinnedColumn || (isVisible && visibleColumnIds.length === 1);
                      const menuLabel = column.fullLabel
                        ? `${column.label} - ${truncateLabel(column.fullLabel, 42)}`
                        : column.label;

                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            checked={isVisible}
                            disabled={disableToggle}
                            draggable={!isPinnedColumn}
                            onDragStart={() => {
                              if (!isPinnedColumn) {
                                setDraggedColumnId(column.id);
                              }
                            }}
                            onDragEnd={() => {
                              if (!isPinnedColumn) {
                                setDraggedColumnId(null);
                              }
                            }}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault();
                              if (!isPinnedColumn) {
                                handleColumnDrop(column.id);
                              }
                            }}
                            onSelect={(event) => event.preventDefault()}
                            onCheckedChange={(checked) => toggleColumnVisibility(column.id, checked === true)}
                            title={column.fullLabel || column.label}
                            className="flex items-center gap-2"
                          >
                            {!isPinnedColumn ? (
                              <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                            ) : (
                              <span className="w-3.5" aria-hidden="true" />
                            )}
                            <span className="min-w-0 flex-1 truncate">{menuLabel}</span>
                            <span className="ml-auto flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                disabled={isPinnedColumn || index === 0}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  if (!isPinnedColumn) {
                                    moveColumnInOrder(column.id, "up");
                                  }
                                }}
                                title="Move column up"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                disabled={isPinnedColumn || index === dropdownColumns.length - 1}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  if (!isPinnedColumn) {
                                    moveColumnInOrder(column.id, "down");
                                  }
                                }}
                                title="Move column down"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </Button>
                            </span>
                            {disableToggle ? <span className="sr-only">At least one column must remain visible</span> : null}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="relative">
                <div className="overflow-hidden rounded-md border">
                  <div
                    ref={tableViewportRef}
                    className="overflow-x-auto"
                    onScroll={updateDragHandleCenters}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleLenientColumnDrop(event.clientX);
                    }}
                  >
                    <Table>
                        <TableHeader className="bg-muted/60">
                          <TableRow className="border-b border-border/80">
                            {visibleOrderedColumns.map((column) => {
                              const isSorted = sortColumnId === column.id;
                              const dynamicColumn = isDynamicColumn(column.id);
                              const isActionsColumn = column.id === ACTIONS_COLUMN_ID;

                            return (
                              <TableHead
                                key={column.id}
                                className={`relative ${isActionsColumn ? "w-[52px] min-w-[52px] max-w-[52px]" : "min-w-[180px]"} px-3 pt-5 pb-2 align-top ${dynamicColumn ? "bg-slate-200/80 dark:bg-slate-800/55" : "bg-muted/60"}`}
                                ref={(node) => {
                                  headerCellRefs.current[column.id] = node;
                                }}
                              >
                                {isActionsColumn ? null : (
                                  <div
                                    className="flex items-center justify-between gap-2"
                                  >
                              <button
                                type="button"
                                onClick={() => handleSort(column.id)}
                                className="inline-flex items-center gap-1 font-semibold hover:underline"
                                title={column.fullLabel || column.label}
                              >
                                {column.label}
                                <ArrowUpDown className={`h-3.5 w-3.5 ${isSorted ? "text-foreground" : "text-muted-foreground"}`} />
                                {isSorted ? <span className="text-[10px] uppercase">{sortDirection}</span> : null}
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant={columnFilters[column.id] ? "default" : "outline"}
                                    size="sm"
                                    className="h-7 px-2"
                                  >
                                    <Filter className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 p-2">
                                  <DropdownMenuLabel className="px-0 py-0 text-xs font-semibold">
                                    Filter {column.fullLabel || column.label}
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <Input
                                    value={columnFilters[column.id] || ""}
                                    onChange={(event) =>
                                      setColumnFilters((previous) => ({
                                        ...previous,
                                        [column.id]: event.target.value,
                                      }))
                                    }
                                    placeholder={column.placeholder || "Filter"}
                                    className="h-8 text-xs"
                                  />
                                  <div className="mt-2 flex justify-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setColumnFilters((previous) => ({
                                          ...previous,
                                          [column.id]: "",
                                        }))
                                      }
                                    >
                                      Clear
                                    </Button>
                                  </div>
                                </DropdownMenuContent>
                              </DropdownMenu>
                                  </div>
                                )}
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participantRows.map((row) => (
                          <TableRow key={row.registration.id} className={getRowStatusTint(row.currentStatus)}>
                            {visibleOrderedColumns.map((column) => {
                              const dynamicColumn = isDynamicColumn(column.id);
                              if (column.id === ACTIONS_COLUMN_ID) {
                                return (
                                  <TableCell key={column.id} className="align-top">
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
                                  </TableCell>
                                );
                              }
                              if (column.id === "participation_status") {
                                return (
                                  <TableCell key={column.id} className="align-top">
                                    <Select
                                      value={row.currentStatus}
                                      onValueChange={(value) =>
                                        handleStatusChange(
                                          row.registration.id,
                                          value as RegistrationStatus,
                                          row.registration.status as RegistrationStatus
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
                                  </TableCell>
                                );
                              }

                              return (
                                <TableCell key={column.id} className={`align-top whitespace-pre-wrap ${dynamicColumn ? getDynamicStatusTint(row.currentStatus) : ""}`}>
                                  {column.getDisplayValue(row)}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
                  {visibleOrderedColumns.map((column) => {
                    if (column.id === ACTIONS_COLUMN_ID || column.id === STATUS_COLUMN_ID) {
                      return null;
                    }

                    const center = dragHandleCenters[column.id];
                    if (typeof center !== "number") {
                      return null;
                    }

                    return (
                      <button
                        key={`drag-handle-${column.id}`}
                        type="button"
                        draggable
                        onDragStart={() => setDraggedColumnId(column.id)}
                        onDragEnd={() => setDraggedColumnId(null)}
                        style={{ left: `${center}px` }}
                        className={`pointer-events-auto absolute top-0 z-20 -translate-x-1/2 -translate-y-1/2 rounded-md border bg-background px-1.5 py-0.5 text-muted-foreground/80 transition-all duration-150 ease-out cursor-grab active:cursor-grabbing hover:text-foreground hover:border-primary/40 hover:bg-muted/50 ${draggedColumnId === column.id ? "scale-105 border-primary/50 bg-primary/10 text-foreground" : ""}`}
                        title="Drag to reorder column"
                        aria-label={`Drag handle for ${(column.fullLabel || column.label)} column`}
                      >
                        <GripHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {participantRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No participants matched the current column filters.</p>
              ) : null}

              {pendingStatusUpdateCount > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Status edits are staged locally until you save them.
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-3">
                <div className="flex flex-wrap items-center gap-2">
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
    </div>
  );
};
