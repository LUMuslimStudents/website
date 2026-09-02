import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays, Clock, MapPin } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider } from "@/components/IslamicPattern";
import { apiRequest } from "@/lib/api";
import { toEventSlug } from "@/lib/utils";

type EventSummary = {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD
  start_time?: string | null; // HH:MM
  end_time?: string | null;
  address?: string | null;
  poster?: string | null;
};

const formatEventDate = (date: string) =>
  new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

const formatTimeRange = (e: EventSummary) => {
  if (!e.start_time) return null;
  return e.end_time ? `${e.start_time}–${e.end_time}` : e.start_time;
};

export const UpcomingEvents = () => {
  const [events, setEvents] = useState<EventSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await apiRequest("/events/current-events", "GET");
        if (!cancelled && Array.isArray(result)) {
          setEvents(result.slice(0, 3));
        }
      } catch {
        // Fetch failed — fall back to an empty list (empty state, no skeleton loop).
        if (!cancelled) setEvents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = events === null;
  const hasEvents = Array.isArray(events) && events.length > 0;

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div
        className="pointer-events-none absolute -left-32 top-16 h-96 w-96 rounded-full bg-primary/[0.06] blur-3xl"
        aria-hidden="true"
      />
      <div className="container relative">
        <Reveal className="text-center">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
            What's happening
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
            Upcoming events
          </h2>
          <OrnamentDivider className="mt-5" />
        </Reveal>

        {loading ? (
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-border/70 bg-card/60"
              >
                <div className="aspect-[16/10] bg-muted/60" />
                <div className="space-y-3 p-6">
                  <div className="h-3 w-24 rounded-full bg-muted/60" />
                  <div className="h-4 w-3/4 rounded-full bg-muted/60" />
                  <div className="h-3 w-1/2 rounded-full bg-muted/60" />
                </div>
              </div>
            ))}
          </div>
        ) : hasEvents ? (
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            {events!.map((event, index) => (
              <Reveal key={event.id} delay={index * 100} className="h-full">
                <Link
                  to={`/events/${toEventSlug(event.title)}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/70 shadow-soft backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-1.5 hover:shadow-lift"
                >
                  {/* <div className="relative aspect-[16/10] overflow-hidden">
                  </div> */}
                  <div className="flex flex-1 flex-col p-6">
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1 text-xs font-medium shadow-soft backdrop-blur-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-gold" />
                      {formatEventDate(event.date)}
                    </span>
                    <h3 className="font-display mt-5 text-xl tracking-tight">
                      {event.title}
                    </h3>
                    <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                      {formatTimeRange(event) && (
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary/70" />
                          {formatTimeRange(event)}
                        </p>
                      )}
                      {event.address && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary/70" />
                          <span className="line-clamp-1">{event.address}</span>
                        </p>
                      )}
                    </div>
                    <span className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-medium text-primary">
                      View event
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-organic group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mx-auto mt-12 max-w-xl text-center text-lg text-muted-foreground">
            No upcoming events right now — check back soon.
          </p>
        )}

        <Reveal delay={120} className="mt-12 text-center">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-full px-8 border-border/80 bg-card/60 backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-0.5 hover:bg-card hover:shadow-soft active:scale-[0.98]"
          >
            <Link to="/events">
              All events
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
};
