import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, Filter, ListFilter, Table2 } from "lucide-react";

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
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

type ParticipantRow = {
  registration: AdminEventRegistration;
  displayName: string;
  answerMap: Record<string, string>;
};

type TableColumn = {
  id: string;
  label: string;
  getSearchValue: (row: ParticipantRow) => string;
  getSortValue: (row: ParticipantRow) => string;
  getDisplayValue: (row: ParticipantRow) => string;
  placeholder?: string;
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const formatDateOnly = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const normalizeText = (value?: string | null) => (value ?? "").toLowerCase().trim();

const getAnswerValue = (registration: AdminEventRegistration, fieldId: string) => {
  const answer = registration.answers.find((item) => item.field_id === fieldId);
  if (!answer) {
    return "—";
  }

  if (answer.selected_options_json && answer.selected_options_json.length > 0) {
    return answer.selected_options_json.join(", ");
  }

  return answer.selected_option_value || answer.short_text_value || "—";
};

const buildParticipantRows = (event: AdminEventDetailType): ParticipantRow[] =>
  event.registrations.map((registration) => {
    const profile = registration.profile;
    const linkedUser = registration.linked_user;
    const displayName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "Unnamed participant";

    return {
      registration,
      displayName,
      answerMap: Object.fromEntries(
        event.form_fields.map((field) => [field.id, getAnswerValue(registration, field.id)])
      ),
    };
  });

const buildBaseColumns = (): TableColumn[] => [
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
    getDisplayValue: (row) => row.registration.profile?.gender || row.registration.linked_user?.gender || "—",
    placeholder: "Search gender",
  },
  {
    id: "status",
    label: "Status",
    getSearchValue: (row) => row.registration.status,
    getSortValue: (row) => row.registration.status,
    getDisplayValue: (row) => row.registration.status,
    placeholder: "Search status",
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

const buildDynamicColumns = (fields: AdminEventFormField[]): TableColumn[] =>
  fields.map((field) => ({
    id: `field:${field.id}`,
    label: field.label,
    getSearchValue: (row) => row.answerMap[field.id] || "",
    getSortValue: (row) => row.answerMap[field.id] || "",
    getDisplayValue: (row) => row.answerMap[field.id] || "—",
    placeholder: "Search answer",
  }));

const AdminGroupedParticipantCard = ({
  registration,
  fields,
}: {
  registration: AdminEventRegistration;
  fields: AdminEventFormField[];
}) => {
  const profile = registration.profile;
  const displayName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "Unnamed participant";
  const linkedUser = registration.linked_user;

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
              {registration.status}
            </span>
            <span className="rounded-full border px-2 py-1 text-muted-foreground">
              {registration.payment_required ? "Payment required" : "No payment due"}
            </span>
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
              <p>Gender: {profile?.gender || linkedUser?.gender || "—"}</p>
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
              <p>Status: {registration.status}</p>
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
              <div className="overflow-x-auto rounded-md border">
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
                            <p>{field.label}</p>
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
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setViewMode("table");
    setSortColumnId("participant");
    setSortDirection("asc");
    setColumnFilters({});
    setColumnOrder([]);

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
        return allIds;
      }

      const retained = previous.filter((id) => allIds.includes(id));
      const appended = allIds.filter((id) => !retained.includes(id));
      return [...retained, ...appended];
    });
  }, [allColumns]);

  const orderedColumns = useMemo(() => {
    if (allColumns.length === 0) {
      return [] as TableColumn[];
    }

    const map = new Map(allColumns.map((column) => [column.id, column]));
    return columnOrder.map((id) => map.get(id)).filter((column): column is TableColumn => Boolean(column));
  }, [allColumns, columnOrder]);

  const participantRows = useMemo(() => {
    if (!event || orderedColumns.length === 0) {
      return [] as ParticipantRow[];
    }

    const rows = buildParticipantRows(event);

    const filteredRows = rows.filter((row) =>
      orderedColumns.every((column) => {
        const filterValue = normalizeText(columnFilters[column.id]);
        if (!filterValue) {
          return true;
        }
        return normalizeText(column.getSearchValue(row)).includes(filterValue);
      })
    );

    const activeSortColumn = orderedColumns.find((column) => column.id === sortColumnId) || orderedColumns[0];

    return [...filteredRows].sort((left, right) => {
      const leftValue = normalizeText(activeSortColumn.getSortValue(left));
      const rightValue = normalizeText(activeSortColumn.getSortValue(right));
      const comparison = leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [columnFilters, event, orderedColumns, sortColumnId, sortDirection]);

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

    setColumnOrder((previous) => {
      const from = previous.indexOf(draggedColumnId);
      const to = previous.indexOf(targetColumnId);
      if (from === -1 || to === -1) {
        return previous;
      }

      const next = [...previous];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggedColumnId(null);
  };

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
                    <AdminGroupedParticipantCard key={registration.id} registration={registration} fields={fields} />
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground">No registered participants yet.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {participantRows.length > 0 ? (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {orderedColumns.map((column) => {
                          const isSorted = sortColumnId === column.id;

                          return (
                            <TableHead
                              key={column.id}
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={() => handleColumnDrop(column.id)}
                              className="min-w-[180px] px-3 py-2 align-top"
                            >
                              <div
                                draggable
                                onDragStart={() => setDraggedColumnId(column.id)}
                                onDragEnd={() => setDraggedColumnId(null)}
                                className="flex items-center justify-between gap-2 cursor-move"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleSort(column.id)}
                                  className="inline-flex items-center gap-1 font-semibold hover:underline"
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
                                      Filter {column.label}
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
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participantRows.map((row) => (
                        <TableRow key={row.registration.id}>
                          {orderedColumns.map((column) => (
                            <TableCell key={column.id} className="align-top whitespace-pre-wrap">
                              {column.getDisplayValue(row)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No participants matched the current column filters.</p>
              )}

              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No dynamic form fields were configured for this event.</p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
