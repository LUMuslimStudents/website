import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminEventSummary } from "./types";

type AdminEventsListProps = {
  events: AdminEventSummary[];
  loading: boolean;
  onOpenEvent: (eventId: number) => void;
};

const formatDateOnly = (value?: string | null) => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const POSTER_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const toDateTime = (date: string, time: string) => {
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isPastEvent = (event: AdminEventSummary) => {
  const eventEnd = toDateTime(event.date, event.end_time);
  if (!eventEnd) {
    return false;
  }
  return eventEnd.getTime() < Date.now();
};

const buildPosterCandidateUrls = (poster: string | null | undefined) => {
  if (!poster) {
    return [];
  }

  if (poster.startsWith("http://") || poster.startsWith("https://")) {
    return [poster];
  }

  const normalizedPoster = poster.startsWith("/") ? poster : `/${poster}`;
  return POSTER_EXTENSIONS.map((ext) => `${API_BASE_URL}${normalizedPoster}/0.${ext}`);
};

const EventPosterThumbnail = ({ event }: { event: AdminEventSummary }) => {
  const candidateUrls = useMemo(() => buildPosterCandidateUrls(event.poster), [event.poster]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  if (candidateUrls.length === 0 || candidateIndex >= candidateUrls.length) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
        No poster
      </div>
    );
  }

  return (
    <img
      src={candidateUrls[candidateIndex]}
      alt={`${event.title} poster`}
      className="h-14 w-14 shrink-0 rounded-md border object-cover"
      loading="lazy"
      onError={() => setCandidateIndex((index) => index + 1)}
    />
  );
};

export const AdminEventsList = ({ events, loading, onOpenEvent }: AdminEventsListProps) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "past">("all");
  const [termFilter, setTermFilter] = useState<string>("all");
  const [invitationFilter, setInvitationFilter] = useState<string>("all");
  const [hasRegistrationsOnly, setHasRegistrationsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "registrations_desc" | "title_asc">("date_desc");

  const allTerms = useMemo(
    () => Array.from(new Set(events.map((event) => event.term).filter(Boolean))).sort((a, b) => b.localeCompare(a)),
    [events]
  );

  const invitationOptions = useMemo(
    () => Array.from(new Set(events.map((event) => event.invitation).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [events]
  );

  const latestTerm = allTerms[0] || "";

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return events.filter((event) => {
      const eventIsPast = isPastEvent(event);

      const matchesSearch =
        normalizedSearch.length === 0 ||
        [event.title, event.address, event.term, event.invitation]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "past" && eventIsPast) ||
        (statusFilter === "upcoming" && !eventIsPast);

      const matchesTerm = termFilter === "all" || event.term === termFilter;
      const matchesInvitation = invitationFilter === "all" || event.invitation === invitationFilter;
      const matchesRegistrations = !hasRegistrationsOnly || event.registration_count > 0;

      return matchesSearch && matchesStatus && matchesTerm && matchesInvitation && matchesRegistrations;
    });
  }, [events, hasRegistrationsOnly, invitationFilter, search, statusFilter, termFilter]);

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const dateA = toDateTime(a.date, a.start_time)?.getTime() ?? 0;
      const dateB = toDateTime(b.date, b.start_time)?.getTime() ?? 0;

      if (sortBy === "date_asc") {
        return dateA - dateB;
      }

      if (sortBy === "registrations_desc") {
        return b.registration_count - a.registration_count;
      }

      if (sortBy === "title_asc") {
        return a.title.localeCompare(b.title);
      }

      return dateB - dateA;
    });
  }, [filteredEvents, sortBy]);

  const groupedByTerm = useMemo(() => {
    const grouped = new Map<string, AdminEventSummary[]>();

    for (const event of sortedEvents) {
      const term = event.term || "Uncategorized";
      const existing = grouped.get(term) || [];
      existing.push(event);
      grouped.set(term, existing);
    }

    return Array.from(grouped.entries())
      .sort(([termA], [termB]) => termB.localeCompare(termA))
      .map(([term, termEvents]) => ({
        term,
        events: termEvents,
      }));
  }, [sortedEvents]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading events...</p>;
  }

  if (events.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No events found.</p>;
  }

  if (filteredEvents.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, address, term, or invitation"
            className="xl:col-span-2"
          />
          <Select value={statusFilter} onValueChange={(value: "all" | "upcoming" | "past") => setStatusFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by timeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All timelines</SelectItem>
              <SelectItem value="upcoming">Upcoming only</SelectItem>
              <SelectItem value="past">Past only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={termFilter} onValueChange={setTermFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All terms</SelectItem>
              {allTerms.map((term) => (
                <SelectItem key={term} value={term}>{term}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: "date_desc" | "date_asc" | "registrations_desc" | "title_asc") => setSortBy(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest first</SelectItem>
              <SelectItem value="date_asc">Oldest first</SelectItem>
              <SelectItem value="registrations_desc">Most registrations</SelectItem>
              <SelectItem value="title_asc">Title A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={hasRegistrationsOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setHasRegistrationsOnly((value) => !value)}
          >
            Has registrations
          </Button>
          <Button
            type="button"
            variant={termFilter === latestTerm && latestTerm ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (!latestTerm) {
                return;
              }
              setTermFilter((current) => (current === latestTerm ? "all" : latestTerm));
            }}
            disabled={!latestTerm}
          >
            Only latest term
          </Button>
          <Button
            type="button"
            variant={statusFilter === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter((current) => (current === "upcoming" ? "all" : "upcoming"))}
          >
            Upcoming
          </Button>
          <Button
            type="button"
            variant={statusFilter === "past" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter((current) => (current === "past" ? "all" : "past"))}
          >
            Past
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setTermFilter("all");
              setInvitationFilter("all");
              setHasRegistrationsOnly(false);
              setSortBy("date_desc");
            }}
          >
            Reset
          </Button>
        </div>
        <p className="py-4 text-center text-sm text-muted-foreground">No events match the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, address, term, or invitation"
          className="xl:col-span-2"
        />
        <Select value={statusFilter} onValueChange={(value: "all" | "upcoming" | "past") => setStatusFilter(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by timeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All timelines</SelectItem>
            <SelectItem value="upcoming">Upcoming only</SelectItem>
            <SelectItem value="past">Past only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={termFilter} onValueChange={setTermFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by term" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All terms</SelectItem>
            {allTerms.map((term) => (
              <SelectItem key={term} value={term}>{term}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={invitationFilter} onValueChange={setInvitationFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by invitation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All invitations</SelectItem>
            {invitationOptions.map((invitation) => (
              <SelectItem key={invitation} value={invitation}>{invitation}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: "date_desc" | "date_asc" | "registrations_desc" | "title_asc") => setSortBy(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Newest first</SelectItem>
            <SelectItem value="date_asc">Oldest first</SelectItem>
            <SelectItem value="registrations_desc">Most registrations</SelectItem>
            <SelectItem value="title_asc">Title A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={hasRegistrationsOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setHasRegistrationsOnly((value) => !value)}
        >
          Has registrations
        </Button>
        <Button
          type="button"
          variant={termFilter === latestTerm && latestTerm ? "default" : "outline"}
          size="sm"
          onClick={() => {
            if (!latestTerm) {
              return;
            }
            setTermFilter((current) => (current === latestTerm ? "all" : latestTerm));
          }}
          disabled={!latestTerm}
        >
          Only latest term
        </Button>
        <Button
          type="button"
          variant={statusFilter === "upcoming" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter((current) => (current === "upcoming" ? "all" : "upcoming"))}
        >
          Upcoming
        </Button>
        <Button
          type="button"
          variant={statusFilter === "past" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter((current) => (current === "past" ? "all" : "past"))}
        >
          Past
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("");
            setStatusFilter("all");
            setTermFilter("all");
            setInvitationFilter("all");
            setHasRegistrationsOnly(false);
            setSortBy("date_desc");
          }}
        >
          Reset
        </Button>
      </div>

      {groupedByTerm.map((group) => (
        <section key={group.term} className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-semibold">{group.term}</h3>
            <Badge variant="secondary">{group.events.length} event{group.events.length === 1 ? "" : "s"}</Badge>
          </div>

          {group.events.map((event) => {
            const eventIsPast = isPastEvent(event);

            return (
              <Card key={event.id} className="cursor-pointer overflow-hidden transition hover:border-primary/40 hover:shadow-sm" onClick={() => onOpenEvent(event.id)}>
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <EventPosterThumbnail event={event} />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-xl">{event.title}</CardTitle>
                          <Badge className={eventIsPast ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"} variant="outline">
                            {eventIsPast ? "Past" : "Upcoming"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDateOnly(event.date)} · {event.start_time} - {event.end_time} · {event.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border px-2 py-1 text-muted-foreground">{event.registration_count} registered</span>
                      <span className="rounded-full border px-2 py-1 text-muted-foreground">{event.invitation}</span>
                      <span className="rounded-full border px-2 py-1 text-muted-foreground">{event.siblings}</span>
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                    <p><span className="text-muted-foreground">Deadline:</span> {formatDateOnly(event.deadline)}</p>
                    <p><span className="text-muted-foreground">Member price:</span> {event.price_member} SEK</p>
                    <p><span className="text-muted-foreground">Non-member price:</span> {event.price_nonmember} SEK</p>
                    <p><span className="text-muted-foreground">Alumnus price:</span> {event.price_alumnus} SEK</p>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4 border-t bg-muted/20 py-4">
                  <p className="text-sm text-muted-foreground">
                    {event.registration_count > 0 ? `${event.registration_count} participant${event.registration_count === 1 ? '' : 's'} available` : 'No registrations yet'}
                  </p>
                  <Button variant="default">Open event</Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      ))}
    </div>
  );
};
