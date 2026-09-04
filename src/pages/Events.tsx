import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ExpandedCardModal } from "@/components/ExpandedCardModal";
import { EventRegistrationForm, type EventRegistrationFooterState } from "@/components/events/EventRegistrationForm";
import { EventMarkdown } from "@/components/events/EventMarkdown";
import { Calendar, CalendarOff, ChevronDown, ExternalLink, MapPin, BadgeCheck, GraduationCap, Clock, Users, CheckCircle2, AlertCircle, CreditCard, Hourglass } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from "react";
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { events_info } from '@prisma/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  TouchTooltip,
} from "@/components/ui/tooltip";
import { useNavigate, useParams } from "react-router-dom";
import { AuroraBackground } from "@/components/AuroraBackground";
import { toEventRoute, toEventSlug, toTermSlug } from "@/lib/utils";

const REGISTERED_EVENTS_PERSIST_KEY = "registered_event_ids";

// Posters always render inside a uniform square frame (1:1). Non-square
// posters (e.g. Instagram's new 4:5) are shown fully — not cropped — over a
// soft blurred copy of the same image, so the empty area stays visually
// pleasing and the cards keep an identical, clean shape.

const formatAddress = (addr: String) => {
  const query = "https://www.google.com/maps/search/?api=1&query=" + addr.split(/[\s,]+/).join('+')
  return (
    <a
      href={query}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-1 underline underline-offset-6 hover:opacity-80"
    >
      <span>{addr}</span>
      <ExternalLink
        className="h-3.5 w-3.5 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </a>
  )
}

const invitation = (event: events_info, big: boolean = false) => {
  let invite;
  let cl = "text-muted-foreground";
  switch (event.invitation) {
    case 'members':
      invite = 'Members';
      break;
    case 'non_members':
      invite = 'LU students';
      break;
    case 'alumni':
      invite = 'LU students & alumni';
      break;
    case 'all_students':
      invite = 'All uni students';
      break;
    default:
      invite = 'Everyone';
  }

  if (event.siblings == 'brothers') {
    invite += ', brothers only';
    // cl = "text-blue-500";
    cl = "text-primary";
  }
  else if (event.siblings == 'sisters') {
    invite += ', sisters only';
    cl = "text-pink-500";
  }
  const size = big ? 5 : 4;
  return <div className={`flex items-center text-${big ? 'lg' : 'sm'} ${cl}`}>
           <Users className={`h-${size} w-${size} mr-${big ? 3 : 2}`} />
           <span>{invite}</span>
         </div>
}

const formatGoogleDate = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

const formatRegistrationDeadline = (deadline: string | Date) =>
  new Date(deadline).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });

const isRegistrationClosed = (event?: { deadline?: string | Date | null }) => {
  if (!event?.deadline) {
    return false;
  }

  const deadlineAt = new Date(event.deadline);
  return !Number.isNaN(deadlineAt.getTime()) && deadlineAt.getTime() <= Date.now();
};

/**
 * Whether an event is open for signups. While closed it is advertised as
 * "coming soon" (no deadline/price shown, registration disabled). Missing
 * value (e.g. legacy payloads) is treated as open.
 */
const isEventOpenForSignup = (event?: { is_open?: boolean }) => event?.is_open !== false;

const buildGoogleCalendarUrl = (event: events_info) => {
  const date = new Date(event.date);
  const [startHour, startMinute] = String(event.start_time).split(":").map(Number);
  const [endHour, endMinute] = String(event.end_time).split(":").map(Number);
  const start = new Date(date);
  const end = new Date(date);

  start.setHours(startHour || 0, startMinute || 0, 0, 0);
  end.setHours(endHour || 0, endMinute || 0, 0, 0);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
    details: event.description ?? "",
    location: event.address ?? "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const buildCalendarUrl = (event: events_info) => {
  return buildGoogleCalendarUrl(event);
};

const sanitizeIcsFileName = (title: string) =>
  title
    .trim()
    .replace(/[^a-zA-Z0-9-_ ]+/g, "")
    .replace(/\s+/g, "-") || "event";

const isMemberExclusive = (event: events_info) => {
  return event.invitation === 'members';
};

// .webp first — new uploads are converted to WebP; jpg/png remain for legacy folders.
const POSTER_EXTENSIONS = ["webp", "png", "jpg", "jpeg", "gif"];
const POSTER_MAX_FILES = 10;

const loadImage = (src: string) =>
  new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });

const resolvePosterUrl = async (basePath: string, index: number) => {
  for (const ext of POSTER_EXTENSIONS) {
    const url = `${basePath}/${index}.${ext}`;
    if (await loadImage(url)) {
      return url;
    }
  }
  return null;
};

const loadPosterUrls = async (basePath: string) => {
  const indices = Array.from({ length: POSTER_MAX_FILES }, (_, index) => index);
  const results = await Promise.all(
    indices.map(async (index) => ({
      index,
      url: await resolvePosterUrl(basePath, index),
    }))
  );

  return results.filter((result) => result.url).map((result) => result.url as string);
};

// const PosterImage = ({
//   basePath,
//   index,
//   alt,
//   className,
// }: {
//   basePath: string;
//   index: number;
//   alt: string;
//   className?: string;
// }) => {
//   const [extIndex, setExtIndex] = useState(0);
//   const [isMissing, setIsMissing] = useState(false);

//   useEffect(() => {
//     setExtIndex(0);
//     setIsMissing(false);
//   }, [basePath, index]);

//   if (isMissing) {
//     return null;
//   }

//   const src = `${basePath}/${index}.${POSTER_EXTENSIONS[extIndex]}`;

//   return (
//     <img
//       src={src}
//       alt={alt}
//       className={className}
//       loading="lazy"
//       onError={() => {
//         if (extIndex < POSTER_EXTENSIONS.length - 1) {
//           setExtIndex(extIndex + 1);
//         } else {
//           setIsMissing(true);
//         }
//       }}
//     />
//   );
// };

const renderMarkdown = (text: string | null | undefined, className?: string) => (
  <EventMarkdown value={text} className={className} />
);

type EventFormFieldOption = string;

type EventFormField = {
  id: string;
  question: string;
  help_text?: string | null;
  field_type: "short_text" | "checkbox_multi" | "radio_single";
  is_required: boolean;
  options: EventFormFieldOption[];
};

type ExpandedEvent = events_info & {
  form_fields?: EventFormField[];
  is_registered?: boolean;
  is_pending_payment?: boolean;
  pending_registration_id?: string | null;
};

/**
 * Instagram-style loading placeholder shown while the event details are
 * being fetched. Pure decoration — replaced by the real content.
 */
const ContentSkeleton = () => (
  <div className="space-y-4 pt-1" aria-hidden="true">
    <div className="skeleton-line w-1/2" />
    <div className="skeleton-line w-3/4" />
    <div className="skeleton-line w-full" />
    <div className="skeleton-line w-5/6" />
    <div className="skeleton-line w-2/3" />
    <div className="skeleton-line mt-7 h-44 w-full rounded-2xl" />
  </div>
);

/**
 * Card-shaped loading skeleton mirroring the real event-card layout
 * (header rows, poster block, footer with price + button).
 */
const EventCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardHeader className="space-y-2.5">
      <div className="flex justify-between gap-3">
        <div className="skeleton-line h-5 w-3/4" />
        <div className="skeleton-line h-3.5 w-20 shrink-0" />
      </div>
      <div className="skeleton-line h-3.5 w-1/2" />
      <div className="skeleton-line h-3.5 w-2/3" />
      <div className="skeleton-line h-3.5 w-1/3" />
    </CardHeader>
    <CardContent>
      <div className="skeleton-line aspect-square w-full rounded-md" />
    </CardContent>
    <CardFooter className="flex items-center justify-between">
      <div className="skeleton-line h-4 w-16" />
      <div className="skeleton-line h-9 w-28 rounded-full" />
    </CardFooter>
  </Card>
);

/**
 * Designed gradient placeholder used wherever an event has no poster
 * (event cards and the expanded modal share the same treatment). Fills
 * whatever poster frame it is rendered inside.
 */
const EventPosterPlaceholder = ({ title }: { title: string }) => (
  <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[hsl(215,82%,32%)] via-[hsl(222,64%,36%)] to-[hsl(30,60%,46%)]">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.16),transparent_55%)]" />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,rgba(0,0,0,0.18),transparent_55%)]" />
    <span className="relative z-10 px-6 text-center font-display italic text-xl md:text-2xl leading-snug text-white/95 text-balance drop-shadow-[0_2px_14px_rgba(0,0,0,0.35)]">
      {title}
    </span>
  </div>
);

/**
 * Poster media that always renders inside a uniform square frame.
 * Square posters fill the frame edge-to-edge; non-square posters (e.g.
 * Instagram's 4:5) are shown in full (not cropped) over a subtle muted
 * surface with a faint ambient highlight, so the leftover area looks
 * intentional without competing with the poster. The frame shape never
 * changes between cards.
 */
const EventPosterFrame = ({
  src,
  alt,
  className = "",
  fallback,
  loading = "lazy",
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
  /** Rendered in place of the image when it cannot be loaded. */
  fallback?: ReactNode;
  loading?: "lazy" | "eager";
  onError?: () => void;
}) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <div className={`relative aspect-square w-full overflow-hidden bg-muted/60 ${className}`}>
      {/* Subtle ambient light so the area around a fitted poster isn't flat. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,hsl(var(--muted-foreground)/0.10),transparent_65%)]" />
      {failed ? fallback : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          className={`relative z-10 h-full w-full object-contain drop-shadow-[0_16px_38px_rgba(0,0,0,0.30)] dark:drop-shadow-[0_0_42px_rgba(255,255,255,0.09)] transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            onError?.();
          }}
        />
      )}
    </div>
  );
};

/**
 * Poster for an event card. Uploads are stored as WebP, but legacy folders
 * may still contain png/jpg files, so the card probes each known extension
 * (webp first) and falls back to the gradient placeholder when nothing loads.
 */
const EventPoster = ({ event }: { event: ExpandedEvent }) => {
  const [extIndex, setExtIndex] = useState(0);
  const ext = POSTER_EXTENSIONS[Math.min(extIndex, POSTER_EXTENSIONS.length - 1)];

  return (
    <EventPosterFrame
      src={`${event.poster}/0.${ext}`}
      alt={`${event.title} poster`}
      className="rounded-md"
      onError={() =>
        setExtIndex((current) =>
          current < POSTER_EXTENSIONS.length - 1 ? current + 1 : current,
        )
      }
      fallback={<EventPosterPlaceholder title={event.title} />}
    />
  );
};

/**
 * Shown when the events feed has finished loading but no events are
 * currently open for registration.
 */
const NoEventsPlaceholder = () => (
  <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 px-6 py-20 text-center md:py-28">
    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted/70">
      <CalendarOff className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
    </div>
    <h2 className="font-display text-2xl font-semibold tracking-tight">
      No events are out right now
    </h2>
    <p className="mt-2 max-w-md text-balance text-muted-foreground">
      We're planning the next one — new events are announced here as soon as they're confirmed. Check back soon!
    </p>
  </div>
);

const Events = () => {
  const navigate = useNavigate();
  // Detail URLs are term-scoped: /events/{term}/{event-slug}. The single
  // `eventSlug` fallback matches legacy /events/:eventSlug links.
  const { term, eventSlug } = useParams<{ term?: string; eventSlug?: string }>();
  const normalizedRouteTerm = term ? term.toLowerCase().trim() : null;
  const normalizedRouteEventSlug = eventSlug ? eventSlug.toLowerCase().trim() : null;

  // const categories = ["All", "Social", "Educational", "Religious", "Community"];
  // const navigate = useNavigate();
  const [events, setEvents] = useState<ExpandedEvent[]>([]);
  const [hasFetchedEvents, setHasFetchedEvents] = useState(false);
  // const [activeCategory, setActiveCategory] = useState("All");
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<ExpandedEvent | null>(null);
  const [registrationFooterState, setRegistrationFooterState] = useState<EventRegistrationFooterState | null>(null);
  const registrationSubmitRef = useRef<(() => void) | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [expandedEventPosters, setExpandedEventPosters] = useState<string[]>([]);
  const [failedPosterCount, setFailedPosterCount] = useState(0);
  // Carousel slide tracking for the poster indicators below the gallery.
  const [activePoster, setActivePoster] = useState(0);
  const posterApiRef = useRef<CarouselApi | null>(null);
  const [isContentReady, setIsContentReady] = useState(false);
  const [persistedRegisteredEventIds, setPersistedRegisteredEventIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(REGISTERED_EVENTS_PERSIST_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((value) => Number.isInteger(value)) : [];
    } catch {
      return [];
    }
  });
  const [cardPosition, setCardPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const eventCacheRef = useRef<Map<number, ExpandedEvent>>(new Map());
  const posterCacheRef = useRef<Map<string, string[]>>(new Map());
  const invalidRouteEventRef = useRef<string | null>(null);
  const activeExpandedEventIdRef = useRef<number | null>(null);
  const detailFetchTimerRef = useRef<number | null>(null);
  const pendingNavigateTimerRef = useRef<number | null>(null);

  const { user } = useAuth();
  const isSignedIn = Boolean(user);
  const [isPaidMember, setIsPaidMember] = useState(false);
  const [isResumingPayment, setIsResumingPayment] = useState(false);

  // Resume an abandoned payment: re-creates a Stripe Checkout Session for the
  // existing draft row (create-checkout reuses the row) and redirects.
  const resumeEventPayment = useCallback(async (event: ExpandedEvent) => {
    const registrationId = event.pending_registration_id;
    if (!registrationId) {
      toast.error("Could not find your pending registration. Please refresh the page and try again.");
      return;
    }
    setIsResumingPayment(true);
    try {
      const { url } = await apiRequest(`/events/${event.id}/checkout`, "POST", {
        registration_id: registrationId,
      });
      window.location.assign(url);
    } catch (error: any) {
      toast.error(error?.message || "Could not open the payment page. Please try again.");
      setIsResumingPayment(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setIsPaidMember(false);
      return;
    }
    let cancelled = false;
    apiRequest('/membership/status', 'GET')
      .then((status) => {
        if (!cancelled) setIsPaidMember(Boolean(status?.paid));
      })
      .catch(() => {
        if (!cancelled) setIsPaidMember(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const isPersistedRegistered = (eventId: number) => persistedRegisteredEventIds.includes(eventId);

  const resolveIsRegistered = (event: ExpandedEvent) => {
    if (isSignedIn) {
      return Boolean(event.is_registered);
    }
    return Boolean(event.is_registered) || isPersistedRegistered(event.id);
  };

  const markPersistedRegistered = (eventId: number) => {
    setPersistedRegisteredEventIds((prev) => {
      if (prev.includes(eventId)) {
        return prev;
      }
      const next = [...prev, eventId];
      localStorage.setItem(REGISTERED_EVENTS_PERSIST_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleFooterSubmitChange = useCallback((submit: (() => void) | null) => {
    registrationSubmitRef.current = submit;
  }, []);

  const buildFallbackCardPosition = useCallback(() => {
    if (typeof window === "undefined") {
      return {
        top: 120,
        left: 24,
        width: 320,
        height: 220,
      };
    }

    const width = Math.min(window.innerWidth * 0.85, 520);
    const height = Math.min(window.innerHeight * 0.45, 360);
    return {
      top: Math.max((window.innerHeight - height) / 2, 32),
      left: Math.max((window.innerWidth - width) / 2, 16),
      width,
      height,
    };
  }, []);

  const openExpandedEvent = useCallback((eventIdToOpen: number, cardElement?: HTMLDivElement | null) => {
    activeExpandedEventIdRef.current = eventIdToOpen;
    const rect = cardElement?.getBoundingClientRect();
    setCardPosition(rect ? {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    } : buildFallbackCardPosition());
    setExpandedEventId(eventIdToOpen);
    setIsClosing(false);
    setIsContentReady(false);
    document.body.style.overflow = "hidden";
  }, [buildFallbackCardPosition]);

  const scheduleExpandedEventDetails = useCallback((eventIdToFetch: number) => {
    if (detailFetchTimerRef.current) {
      window.clearTimeout(detailFetchTimerRef.current);
      detailFetchTimerRef.current = null;
    }

    // Fetch immediately on open (details are as fresh as possible), but
    // only APPLY the result once the expand animation has settled (~650ms).
    // Swapping heavy content (forms, markdown) in mid-animation caused
    // dropped frames — the animation now owns the main thread first.
    const startedAt = Date.now();
    void (async () => {
      try {
        const event = await apiRequest(`/events/event-by-id?id=${eventIdToFetch}`);
        const normalizedEvent = {
          ...event,
          is_registered: resolveIsRegistered(event),
        };
        const remaining = Math.max(0, 650 - (Date.now() - startedAt));
        detailFetchTimerRef.current = window.setTimeout(() => {
          if (activeExpandedEventIdRef.current === eventIdToFetch) {
            setExpandedEvent(normalizedEvent);
            eventCacheRef.current.set(normalizedEvent.id, normalizedEvent);
          }
          setIsContentReady(true);
        }, remaining);
      } catch (error: any) {
        // Even on failure, reveal what we already have instead of leaving
        // the skeleton up forever.
        setIsContentReady(true);
        toast.error(error.message || "Failed to fetch event");
      }
    })();
  }, []);


  const priceTag = (event: events_info, overridePrice?: number, overrideTier?: "member" | "nonmember" | "alumnus") => {
    const price = overridePrice ?? (isPaidMember ? event.price_member : event.price_nonmember);
    const tier = overrideTier ?? (user ? "member" : "nonmember");
    if (tier === "member") {
      const shouldShowStrikethrough = !isMemberExclusive(event) && price < event.price_nonmember;
      return <div className="flex flex-col items-start leading-tight">
        <div className="flex flex-wrap items-center gap-x-1.5">
          <span>{price} SEK</span>
          <TouchTooltip
            triggerClassName="inline-flex items-center"
            contentClassName="text-sm"
            content="Member price 🌟"
          >
            <BadgeCheck className="h-4 w-4 text-green-500" />
          </TouchTooltip>
        </div>
        {shouldShowStrikethrough && (
          <span className="mt-0.5 text-xs text-muted-foreground line-through">{event.price_nonmember} SEK</span>
        )}
      </div>
    }

    if (tier === "alumnus") {
      return <div className="flex flex-wrap items-center gap-x-1.5">
        <span>{price} SEK</span>
        <TouchTooltip
          triggerClassName="inline-flex items-center"
          contentClassName="text-sm"
          content="Alumnus price"
        >
          <GraduationCap className="h-4 w-4 text-sky-600" />
        </TouchTooltip>
      </div>
    }

    return <span>{price} SEK</span>;
  };

  const renderRegistrationButtonLabel = (event: ExpandedEvent) => {
    if (event.is_pending_payment) {
      return (
        <span className="inline-flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          {isResumingPayment ? "Opening payment…" : "Complete payment"}
        </span>
      );
    }

    if (event.is_registered) {
      return (
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Registered!
        </span>
      );
    }

    if (isRegistrationClosed(event)) {
      return (
        <span className="inline-flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Registration closed
        </span>
      );
    }

    return "Register Now";
  };

  useEffect(() => {
    const fetchEvents = async () => {  
      try {
        const evs = await apiRequest('/events/current-events');
        const normalized = (evs as ExpandedEvent[]).map((event) => ({
          ...event,
          is_registered: resolveIsRegistered(event),
        }));
        setEvents(normalized);
        normalized.forEach((event: ExpandedEvent) => {
          eventCacheRef.current.set(event.id, event);
        });
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch events');
      } finally {
        setHasFetchedEvents(true);
      }
    };

    fetchEvents();
  }, [isSignedIn]);

  useEffect(() => {
    // Plain listing (/events) — nothing to resolve from the URL.
    if (!normalizedRouteTerm && !normalizedRouteEventSlug) {
      invalidRouteEventRef.current = null;
      return;
    }

    // Legacy one-segment URLs (/events/:eventSlug) predate term-scoped
    // routes and can no longer be resolved to an event.
    if (!normalizedRouteTerm || !normalizedRouteEventSlug) {
      if (hasFetchedEvents) {
        const key = normalizedRouteEventSlug ?? normalizedRouteTerm ?? '';
        if (invalidRouteEventRef.current !== key) {
          toast.error('This event is no longer available.');
          invalidRouteEventRef.current = key;
        }
        navigate('/events', { replace: true });
      }
      return;
    }

    const targetEvent = events.find(
      (event) =>
        toTermSlug(event.term) === normalizedRouteTerm &&
        toEventSlug(event.title) === normalizedRouteEventSlug,
    );

    if (targetEvent) {
      invalidRouteEventRef.current = null;
      if (expandedEventId !== targetEvent.id) {
        setExpandedEvent(targetEvent);
        openExpandedEvent(targetEvent.id, cardRefs.current[targetEvent.id]);
        scheduleExpandedEventDetails(targetEvent.id);
      }
      return;
    }

    if (hasFetchedEvents) {
      const key = `${normalizedRouteTerm}/${normalizedRouteEventSlug}`;
      if (invalidRouteEventRef.current !== key) {
        toast.error('This event is no longer available.');
        invalidRouteEventRef.current = key;
      }
      navigate('/events', { replace: true });
    }
  }, [normalizedRouteTerm, normalizedRouteEventSlug, events, hasFetchedEvents, expandedEventId, navigate, openExpandedEvent, scheduleExpandedEventDetails]);

  const handleCardClick = (event: events_info, cardElement: HTMLDivElement) => {
    const listEvent = events.find((currentEvent) => currentEvent.id === event.id);
    if (listEvent) {
      setExpandedEvent(listEvent);
      eventCacheRef.current.set(listEvent.id, listEvent);
    }
    openExpandedEvent(event.id, cardElement);
    scheduleExpandedEventDetails(event.id);

    // Defer the URL update until the expand animation has settled. The
    // router state change re-renders the whole Events page; doing it in
    // the same commit as the modal mount starved the animation's first
    // frames (the choppy start, worst on Firefox).
    if (pendingNavigateTimerRef.current) {
      window.clearTimeout(pendingNavigateTimerRef.current);
    }
    pendingNavigateTimerRef.current = window.setTimeout(() => {
      pendingNavigateTimerRef.current = null;
      navigate(toEventRoute(event.term, event.title));
    }, 650);
  };

  const handleIcsDownload = useCallback(async (event: events_info) => {
    try {
      const payload = await apiRequest(`/events/${event.id}/ics`);
      if (typeof payload !== "string") {
        throw new Error("Invalid ICS response");
      }

      const blob = new Blob([payload], { type: "text/calendar;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `${sanitizeIcsFileName(event.title)}.ics`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate calendar file");
    }
  }, []);

  const handleCloseExpanded = () => {
    if (pendingNavigateTimerRef.current) {
      window.clearTimeout(pendingNavigateTimerRef.current);
      pendingNavigateTimerRef.current = null;
    }
    setIsClosing(true);
    setTimeout(() => {
      setExpandedEventId(null);
      setIsClosing(false);
      document.body.style.overflow = "unset";
      navigate('/events');
    }, 600);
  };

  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset";
      if (detailFetchTimerRef.current) {
        window.clearTimeout(detailFetchTimerRef.current);
      }
      if (pendingNavigateTimerRef.current) {
        window.clearTimeout(pendingNavigateTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!expandedEventId) {
      setExpandedEvent(null);
      setExpandedEventPosters([]);
      setFailedPosterCount(0);
      setActivePoster(0);
      setIsContentReady(false);
      setRegistrationFooterState(null);
      registrationSubmitRef.current = null;
      activeExpandedEventIdRef.current = null;
      if (detailFetchTimerRef.current) {
        window.clearTimeout(detailFetchTimerRef.current);
        detailFetchTimerRef.current = null;
      }
      return;
    }
  }, [expandedEventId]);

  useEffect(() => {
    if (!expandedEvent?.poster) {
      setExpandedEventPosters([]);
      return;
    }

    let isCancelled = false;
    const basePath = expandedEvent.poster;

    const cachedPosters = posterCacheRef.current.get(basePath);
    if (cachedPosters) {
      setExpandedEventPosters(cachedPosters);
      return;
    }

    setExpandedEventPosters([`${basePath}/0.${POSTER_EXTENSIONS[0]}`]);

    const fetchPosters = async () => {
      try {
        const urls = await loadPosterUrls(basePath);
        if (!isCancelled) {
          posterCacheRef.current.set(basePath, urls);
          setExpandedEventPosters(urls);
        }
      } catch (error: any) {
        if (!isCancelled) {
          setExpandedEventPosters([`${basePath}/0.${POSTER_EXTENSIONS[0]}`]);
        }
      }
    };

    // Probe additional poster files only after the expand animation has
    // settled — firing ~50 image probes the moment the modal opened caused
    // a network/decode burst mid-animation (jitter). The main poster is
    // already cached from the grid card, so the visible content is
    // unaffected.
    const probeTimer = window.setTimeout(fetchPosters, 650);

    return () => {
      isCancelled = true;
      window.clearTimeout(probeTimer);
    };
  }, [expandedEvent?.poster]);

  // Keep the carousel indicator in sync: reset to the first poster whenever
  // the poster set changes, then follow embla's selected snap on scroll/click.
  useEffect(() => {
    setActivePoster(0);
    const api = posterApiRef.current;
    if (!api) {
      return;
    }

    const sync = () => setActivePoster(api.selectedScrollSnap());
    sync();
    api.on("select", sync);
    api.on("reInit", sync);
    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [expandedEventPosters]);

  return (
    <div className="min-h-dvh flex flex-col page">
      <Navbar overlay />
      <main className="flex-1 relative">
        <AuroraBackground />
        <div className="container relative z-10 pt-24 md:pt-28 pb-8">
          <h1 className="text-4xl font-bold mb-8 animate-in">Upcoming Events</h1>
        {/* <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              onClick={() => setActiveCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div> */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!hasFetchedEvents
            ? Array.from({ length: 6 }).map((_, index) => (
                <EventCardSkeleton key={`skeleton-${index}`} />
              ))
            : events.length === 0
              ? <NoEventsPlaceholder />
              : events.map((event) => (
            <Card
              key={event.id}
              className="hover-card cursor-pointer active:scale-[0.99]"
              ref={(el) => {
                if (el) cardRefs.current[event.id] = el;
              }}
              onClick={() => {
                const cardEl = cardRefs.current[event.id];
                if (cardEl) handleCardClick(event, cardEl);
              }}
            >
              <CardHeader className="flex justify-between">
                <div className="flex justify-between ">
                <CardTitle className="max-w-[60%] min-h-[3rem]">{event.title}</CardTitle>

                {isEventOpenForSignup(event) && (
                <TouchTooltip
                  contentClassName="text-xs"
                  content="Registration deadline"
                  >
                  <span className="text-xs flex gap-x-1 text-amber-600">
                    <Clock className="h-4 w-4" />
                    <p>{formatRegistrationDeadline(event.deadline)}</p>
                  </span>
                </TouchTooltip>
                )}
                  </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {event.date.toString()}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.address}
                </div>
                {invitation(event)}
              </CardHeader>
              <CardContent>
                <EventPoster event={event} />
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                {isEventOpenForSignup(event) ? (
                  <>
                    <div className="font-medium">{priceTag(event)}</div>
                    <div className="flex flex-col items-end gap-2">
                      {isRegistrationClosed(event) && !event.is_registered && !event.is_pending_payment && (
                        <span className="text-xs text-red-600">
                          Deadline has passed
                        </span>
                      )}
                      <Button
                        variant={event.is_pending_payment ? "default" : event.is_registered || isRegistrationClosed(event) ? "outline" : "default"}
                        className={event.is_registered
                          ? "border-green-600 text-green-600 hover:bg-green-50"
                          : event.is_pending_payment
                            ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
                            : isRegistrationClosed(event)
                              ? "border-border text-muted-foreground bg-muted/50 hover:bg-muted/50 opacity-80"
                              : ""}
                        disabled={Boolean(event.is_registered || (isRegistrationClosed(event) && !event.is_pending_payment) || isResumingPayment)}
                        onClick={(e) => {
                          if (event.is_pending_payment) {
                            e.stopPropagation();
                            resumeEventPayment(event);
                          }
                        }}
                      >
                        {renderRegistrationButtonLabel(event)}
                      </Button>
                    </div>
                  </>
                ) : (
                  <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300">
                    <Hourglass className="h-4 w-4" aria-hidden="true" />
                    Coming soon
                  </span>
                )}
              </CardFooter>
            </Card>
            ))}
        </div>
        </div>
      </main>
      <Footer />

      <ExpandedCardModal
        isOpen={expandedEventId !== null}
        isClosing={isClosing}
        onClose={handleCloseExpanded}
        cardPosition={cardPosition}
        showShareButton={expandedEventId !== null}
        shareTitle={expandedEvent?.title ?? "LUMS Event"}
        shareText={expandedEvent ? `Join me at ${expandedEvent.title}` : "Check out this event"}
        shareUrl={expandedEvent
          ? `${window.location.origin}${toEventRoute(expandedEvent.term, expandedEvent.title)}`
          : undefined}
        footer={registrationFooterState && expandedEvent && isEventOpenForSignup(expandedEvent) ? (
          <div className="expanded-card-footer flex items-center justify-between gap-4">
            <div className="text-xl font-semibold">
              {priceTag(expandedEvent, registrationFooterState.displayPrice, registrationFooterState.displayPriceTier)}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => registrationSubmitRef.current?.()}
                disabled={
                  registrationFooterState.isAlreadyRegistered ||
                  registrationFooterState.isSubmittingRegistration ||
                  (registrationFooterState.isPendingPayment && registrationFooterState.isResumingPayment) ||
                  (isRegistrationClosed(expandedEvent) && !registrationFooterState.isPendingPayment) ||
                  !registrationFooterState.isFormReady
                }
                variant={
                  registrationFooterState.isAlreadyRegistered ||
                  (isRegistrationClosed(expandedEvent) && !registrationFooterState.isPendingPayment)
                    ? "outline"
                    : "default"
                }
                className={registrationFooterState.isAlreadyRegistered
                  ? "border-green-600 text-green-600 hover:bg-green-50"
                  : registrationFooterState.isPendingPayment
                    ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
                    : isRegistrationClosed(expandedEvent)
                      ? "border-border text-muted-foreground bg-muted/50 hover:bg-muted/50 opacity-80"
                      : ""}
              >
                {registrationFooterState.isAlreadyRegistered ? (
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Registered!
                  </span>
                ) : registrationFooterState.isPendingPayment ? (
                  <span className="inline-flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {registrationFooterState.isResumingPayment ? "Opening payment…" : "Complete payment"}
                  </span>
                ) : isRegistrationClosed(expandedEvent) ? (
                  <span className="inline-flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Registration closed
                  </span>
                ) : registrationFooterState.isSubmittingRegistration ? (
                  "Submitting..."
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </div>
        ) : null}
      >
        {expandedEvent && (
          <>
          <div className="expanded-card-header">
            <h2 className="text-3xl font-bold mb-4">{expandedEvent.title}</h2>
            <div className="grid gap-y-2 mb-5">
              <div className="flex flex-wrap items-center text-lg text-muted-foreground">
                <Calendar className="h-5 w-5 mr-3" />
                <div className="inline-flex items-center">
                  {expandedEvent.date.toString()}, {expandedEvent.start_time.toString()}-{expandedEvent.end_time.toString()}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      type="button"
                      aria-label="Calendar options"
                      className="ml-1 inline-flex items-center text-muted-foreground hover:opacity-80"
                    >
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem asChild>
                        <a
                          href={buildCalendarUrl(expandedEvent)}
                          target="_blank"
                        >
                          Add to calendar
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          void handleIcsDownload(expandedEvent);
                        }}
                      >
                        Download .ics
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex items-center text-lg text-muted-foreground">
                <MapPin className="h-5 w-5 mr-3" />
                {formatAddress(expandedEvent.address)}
              </div>
              {invitation(expandedEvent, true)}
              {isEventOpenForSignup(expandedEvent) && (
              <div className="flex items-center text-lg text-amber-600">
                <Clock className="h-5 w-5 mr-3" />
                <p>Deadline: {formatRegistrationDeadline(expandedEvent.deadline)}</p>
              </div>
              )}
            </div>
            </div>
            <div className="expanded-card-body">
              <div className="mx-auto w-full max-w-4xl">
                {expandedEventPosters.length > 0 && failedPosterCount < expandedEventPosters.length ? (
                  <>
                    <Carousel
                      className={`${expandedEventPosters.length > 1 ? "mb-1" : "mb-6"} w-[520px] max-w-full mx-auto`}
                      setApi={(api) => {
                        posterApiRef.current = api;
                      }}
                    >
                      <CarouselContent>
                        {expandedEventPosters.map((poster, index) => (
                          <CarouselItem key={`${poster}-${index}`}>
                            <EventPosterFrame
                              src={poster}
                              alt={`${expandedEvent.title} poster ${index + 1}`}
                              className="rounded-md"
                              fallback={<EventPosterPlaceholder title={expandedEvent.title} />}
                              onError={() => setFailedPosterCount((count) => count + 1)}
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2 bg-background/80 shadow-md" />
                      <CarouselNext className="right-2 bg-background/80 shadow-md" />
                    </Carousel>
                    {expandedEventPosters.length > 1 && (
                      <div className="mb-6 mt-3 flex items-center justify-center gap-4">
                        <div
                          role="group"
                          aria-label="Choose poster"
                          className="flex items-center gap-1.5"
                        >
                          {expandedEventPosters.map((poster, index) => (
                            <button
                              key={`${poster}-dot-${index}`}
                              type="button"
                              aria-label={`Show poster ${index + 1} of ${expandedEventPosters.length}`}
                              aria-current={index === activePoster ? "true" : undefined}
                              onClick={() => posterApiRef.current?.scrollTo(index)}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                index === activePoster
                                  ? "w-5 bg-foreground/70"
                                  : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground tabular-nums">
                          {activePoster + 1} / {expandedEventPosters.length}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative mx-auto mb-6 aspect-square w-full max-w-[520px] overflow-hidden rounded-md">
                    <EventPosterPlaceholder title={expandedEvent.title} />
                  </div>
                )}
                {isContentReady ? (
                  <div className="modal-content-fade-in">
                    {renderMarkdown(expandedEvent.description)}
                    {isEventOpenForSignup(expandedEvent) ? (
                    <EventRegistrationForm
                event={expandedEvent}
                isRegistrationClosed={isRegistrationClosed(expandedEvent)}
                isSignedIn={isSignedIn}
                isPaidMember={isPaidMember}
                user={user}
                onCancelled={(eventId) => {
                  const reset = (event: ExpandedEvent): ExpandedEvent => ({
                    ...event,
                    is_registered: false,
                    is_pending_payment: false,
                    pending_registration_id: null,
                  });
                  setEvents((prev) => prev.map((event) => (
                    event.id === eventId ? reset(event) : event
                  )));
                  setExpandedEvent((prev) => (
                    prev && prev.id === eventId ? reset(prev) : prev
                  ));
                  const cached = eventCacheRef.current.get(eventId);
                  if (cached) {
                    eventCacheRef.current.set(eventId, reset(cached));
                  }
                }}
                onFooterStateChange={setRegistrationFooterState}
                onFooterSubmitChange={handleFooterSubmitChange}
                onRegistered={(eventId, paymentRequired, registrationId) => {
                  if (paymentRequired) {
                    setEvents((prev) => prev.map((event) => (
                      event.id === eventId ? { ...event, is_registered: false, is_pending_payment: true, pending_registration_id: registrationId ?? null } : event
                    )));
                    setExpandedEvent((prev) => (
                      prev && prev.id === eventId ? { ...prev, is_registered: false, is_pending_payment: true, pending_registration_id: registrationId ?? null } : prev
                    ));
                    return;
                  }
                  markPersistedRegistered(eventId);
                  setEvents((prev) => prev.map((event) => (
                    event.id === eventId ? { ...event, is_registered: true, is_pending_payment: false, pending_registration_id: null } : event
                  )));
                  setExpandedEvent((prev) => (
                    prev && prev.id === eventId ? { ...prev, is_registered: true, is_pending_payment: false, pending_registration_id: null } : prev
                  ));
                }}
              />
                    ) : (
                      <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-300/70 bg-amber-50/40 px-6 py-12 text-center dark:border-amber-500/30 dark:bg-amber-950/20">
                        <Hourglass className="mb-4 h-9 w-9 text-amber-500" aria-hidden="true" />
                        <h3 className="font-display text-xl font-semibold tracking-tight">
                          Not open for sign up yet
                        </h3>
                        <p className="mt-2 max-w-sm text-balance text-sm text-muted-foreground">
                          This event is coming soon — registration opens closer to the date. Check back to grab your spot!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <ContentSkeleton />
                )}
              </div>
            </div>
          </>
        )}
      </ExpandedCardModal>
    </div>
  );
};

export default Events;
