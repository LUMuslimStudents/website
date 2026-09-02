import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider } from "@/components/IslamicPattern";
import { apiRequest } from "@/lib/api";
import { toEventSlug } from "@/lib/utils";

type GalleryEvent = {
  id: number;
  title: string;
  poster?: string | null;
};

export const Gallery = () => {
  const [events, setEvents] = useState<GalleryEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await apiRequest("/events/past-events", "GET");
        if (!cancelled && Array.isArray(result)) {
          // Keep only events that actually have a poster.
          setEvents(result.filter((e) => e?.poster).slice(0, 6));
        }
      } catch {
        // Fetch failed — fall back to an empty list (section hides).
        if (!cancelled) setEvents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (events !== null && events.length === 0) return null;

  const loading = events === null;

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-gold/[0.07] blur-3xl"
        aria-hidden="true"
      />
      <div className="container relative">
        <Reveal className="text-center">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
            Memories
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
            Gallery
          </h2>
          <OrnamentDivider className="mt-5" />
        </Reveal>

        {loading ? (
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="aspect-[4/3] animate-pulse rounded-2xl bg-muted/60"
              />
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {events!.map((event, index) => (
              <Reveal key={event.id} delay={index * 60}>
                <Link
                  to={`/events/${toEventSlug(event.title)}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-border/70 shadow-soft transition-all duration-300 ease-organic hover:-translate-y-1 hover:shadow-lift"
                >
                  <img
                    src={event.poster!}
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-500 ease-organic group-hover:scale-[1.05]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="p-4 text-sm font-medium text-white">
                      {event.title}
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        <Reveal delay={120} className="mt-12 text-center">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-full px-8 border-border/80 bg-card/60 backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-0.5 hover:bg-card hover:shadow-soft active:scale-[0.98]"
          >
            <Link to="/events">
              See all events
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
};
