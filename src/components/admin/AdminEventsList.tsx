import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export const AdminEventsList = ({ events, loading, onOpenEvent }: AdminEventsListProps) => {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading events...</p>;
  }

  if (events.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No events found.</p>;
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id} className="cursor-pointer overflow-hidden transition hover:border-primary/40 hover:shadow-sm" onClick={() => onOpenEvent(event.id)}>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl">{event.title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateOnly(event.date)} · {event.start_time} - {event.end_time} · {event.address}
                </p>
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
      ))}
    </div>
  );
};
