import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ExpandedCardModal } from "@/components/ExpandedCardModal";
import { EventRegistrationForm, type EventRegistrationFooterState } from "@/components/events/EventRegistrationForm";
import { EventMarkdown } from "@/components/events/EventMarkdown";
import { Calendar, ChevronDown, ExternalLink, MapPin, BadgeCheck, GraduationCap, Clock, Users, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
} from "@/components/ui/carousel";
import {
  TouchTooltip,
} from "@/components/ui/tooltip";
import { useNavigate, useParams } from "react-router-dom";

const REGISTERED_EVENTS_PERSIST_KEY = "registered_event_ids";

const toEventSlug = (title: string) => title
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, "")
  .replace(/\s+/g, "-")
  .replace(/-+/g, "-");

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

const POSTER_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
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

const Events = () => {
  const navigate = useNavigate();
  const { eventSlug } = useParams<{ eventSlug?: string }>();
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
    document.body.style.overflow = "hidden";
  }, [buildFallbackCardPosition]);

  const scheduleExpandedEventDetails = useCallback((eventIdToFetch: number) => {
    if (detailFetchTimerRef.current) {
      window.clearTimeout(detailFetchTimerRef.current);
      detailFetchTimerRef.current = null;
    }

    detailFetchTimerRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          const event = await apiRequest(`/events/event-by-id?id=${eventIdToFetch}`);
          const normalizedEvent = {
            ...event,
            is_registered: resolveIsRegistered(event),
          };
          if (activeExpandedEventIdRef.current === eventIdToFetch) {
            setExpandedEvent(normalizedEvent);
            eventCacheRef.current.set(normalizedEvent.id, normalizedEvent);
          }
        } catch (error: any) {
          toast.error(error.message || "Failed to fetch event");
        }
      })();
    }, 600);
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
    if (!normalizedRouteEventSlug) {
      invalidRouteEventRef.current = null;
      return;
    }

    const targetEvent = events.find((event) => toEventSlug(event.title) === normalizedRouteEventSlug);

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
      if (invalidRouteEventRef.current !== normalizedRouteEventSlug) {
        toast.error('This event is no longer available.');
        invalidRouteEventRef.current = normalizedRouteEventSlug;
      }
      navigate('/events', { replace: true });
    }
  }, [normalizedRouteEventSlug, events, hasFetchedEvents, expandedEventId, navigate, openExpandedEvent, scheduleExpandedEventDetails]);

  const handleCardClick = (event: events_info, cardElement: HTMLDivElement) => {
    const listEvent = events.find((currentEvent) => currentEvent.id === event.id);
    if (listEvent) {
      setExpandedEvent(listEvent);
      eventCacheRef.current.set(listEvent.id, listEvent);
    }
    openExpandedEvent(event.id, cardElement);
    scheduleExpandedEventDetails(event.id);
    navigate(`/events/${toEventSlug(event.title)}`);
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
    };
  }, []);

  useEffect(() => {
    if (!expandedEventId) {
      setExpandedEvent(null);
      setExpandedEventPosters([]);
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

    setExpandedEventPosters([`${basePath}/0.png`]);

    const fetchPosters = async () => {
      try {
        const urls = await loadPosterUrls(basePath);
        if (!isCancelled) {
          posterCacheRef.current.set(basePath, urls);
          setExpandedEventPosters(urls);
        }
      } catch (error: any) {
        if (!isCancelled) {
          setExpandedEventPosters([`${basePath}/0.png`]);
        }
      }
    };

    fetchPosters();

    return () => {
      isCancelled = true;
    };
  }, [expandedEvent?.poster]);

  return (
    <div className="min-h-screen flex flex-col page">
      <Navbar />
      <main className="flex-1 container py-8">
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
          {events.map((event) => (
            <Card
              key={event.id}
              className="hover-card cursor-pointer transition-transform hover:scale-105"
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

                <TouchTooltip
                  contentClassName="text-xs"
                  content="Registration deadline"
                  >
                  <span className="text-xs flex gap-x-1 text-amber-600">
                    <Clock className="h-4 w-4" />
                    <p>{formatRegistrationDeadline(event.deadline)}</p>
                  </span>
                </TouchTooltip>
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
                <img
                  src={`${event.poster}/0.png`}
                  alt="No poster available"
                  className="aspect-square w-96 rounded-md object-cover"
                  loading="lazy"
                />
              </CardContent>
              <CardFooter className="flex justify-between items-center">
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
              </CardFooter>
            </Card>
          ))}
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
          ? `${window.location.origin}/events/${toEventSlug(expandedEvent.title)}`
          : undefined}
        footer={registrationFooterState && expandedEvent ? (
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
          <div className="expanded-card-layout">
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
              <div className="flex items-center text-lg text-amber-600">
                <Clock className="h-5 w-5 mr-3" />
                <p>Deadline: {formatRegistrationDeadline(expandedEvent.deadline)}</p>
              </div>
            </div>
            <div className="expanded-card-body">
              {expandedEventPosters.length > 0 && (
                <Carousel className="mb-6 w-[520px] max-w-full mx-auto">
                  <CarouselContent>
                    {expandedEventPosters.map((poster, index) => (
                      <CarouselItem key={`${poster}-${index}`}>
                        <img
                          src={poster}
                          alt={`${expandedEvent.title} poster ${index + 1}`}
                          className="aspect-square w-full rounded-md object-contain bg-muted"
                          loading="lazy"
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2 bg-background/80 shadow-md" />
                  <CarouselNext className="right-2 bg-background/80 shadow-md" />
                </Carousel>
              )}
              {renderMarkdown(expandedEvent.description)}
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
            </div>
          </div>
        )}
      </ExpandedCardModal>
    </div>
  );
};

export default Events;
