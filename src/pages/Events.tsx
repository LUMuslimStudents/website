import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ExpandedCardModal } from "@/components/ExpandedCardModal";
import { EventRegistrationForm } from "@/components/events/EventRegistrationForm";
import { Calendar, ChevronDown, ExternalLink, MapPin, BadgeCheck, Clock, Users, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
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

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const REGISTERED_EVENTS_SESSION_KEY = "registered_event_ids";
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{6,14}$/;
const SCHOOL_TEXT_REGEX = /^[A-Za-z0-9À-ÖØ-öø-ÿ .,'()&+\/-]{2,100}$/;

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
  return <div className={`flex items-center text-${big ? 'lg' : 'sm'} ${cl} mb-6`}>
           <Users className={`h-${size} w-${size} mr-${big ? 3 : 2}`} />
           <span>{invite}</span>
         </div>
}

const buildIcsDownloadUrl = (event: events_info) => `${API_BASE_URL}/api/events/${event.id}/ics`;

const formatGoogleDate = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

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
  const icsUrl = buildIcsDownloadUrl(event);

  if (typeof navigator === "undefined") {
    return buildGoogleCalendarUrl(event);
  }

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIos) {
    return icsUrl;
  }
  return buildGoogleCalendarUrl(event);
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
  <div className={`prose dark:prose-invert max-w-none text-muted-foreground ${className ?? ""}`.trim()}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
    >
      {text ?? ""}
    </ReactMarkdown>
  </div>
);

type EventFormFieldOption = {
  id: string;
  value: string;
  label: string;
};

type EventFormField = {
  id: string;
  label: string;
  help_text?: string | null;
  field_type: "short_text" | "checkbox_multi" | "radio_single";
  is_required: boolean;
  options: EventFormFieldOption[];
};

type ExpandedEvent = events_info & {
  form_fields?: EventFormField[];
  is_registered?: boolean;
};

type RegistrationProfile = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  gender: "male" | "female" | "";
  is_student: boolean;
  university_name: string;
  study_program: string;
  is_alumnus: boolean;
};

const Events = () => {
  // const categories = ["All", "Social", "Educational", "Religious", "Community"];
  // const navigate = useNavigate();
  const [events, setEvents] = useState<ExpandedEvent[]>([]);
  // const [activeCategory, setActiveCategory] = useState("All");
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<ExpandedEvent | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [expandedEventPosters, setExpandedEventPosters] = useState<string[]>([]);
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [sessionRegisteredEventIds, setSessionRegisteredEventIds] = useState<number[]>(() => {
    try {
      const raw = sessionStorage.getItem(REGISTERED_EVENTS_SESSION_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((value) => Number.isInteger(value)) : [];
    } catch {
      return [];
    }
  });
  const [registrationProfile, setRegistrationProfile] = useState<RegistrationProfile>({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    gender: "",
    is_student: false,
    university_name: "",
    study_program: "",
    is_alumnus: false,
  });
  const [fieldAnswers, setFieldAnswers] = useState<Record<string, string | string[]>>({});
  const [cardPosition, setCardPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const eventCacheRef = useRef<Map<number, ExpandedEvent>>(new Map());

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const isSignedIn = Boolean(user);

  const updateProfileField = (field: keyof RegistrationProfile, value: string | boolean) => {
    setRegistrationProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateAnswer = (fieldId: string, value: string | string[]) => {
    setFieldAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const toggleCheckboxAnswer = (fieldId: string, value: string, checked: boolean) => {
    setFieldAnswers((prev) => {
      const current = Array.isArray(prev[fieldId]) ? (prev[fieldId] as string[]) : [];
      if (checked) {
        return { ...prev, [fieldId]: [...new Set([...current, value])] };
      }
      return { ...prev, [fieldId]: current.filter((item) => item !== value) };
    });
  };

  const isSessionRegistered = (eventId: number) => sessionRegisteredEventIds.includes(eventId);

  const markSessionRegistered = (eventId: number) => {
    setSessionRegisteredEventIds((prev) => {
      if (prev.includes(eventId)) {
        return prev;
      }
      const next = [...prev, eventId];
      sessionStorage.setItem(REGISTERED_EVENTS_SESSION_KEY, JSON.stringify(next));
      return next;
    });
  };

  const getProfileRegexError = (
    profile: RegistrationProfile,
    invitationType: string,
    signedIn: boolean,
  ): string | null => {
    if (signedIn) {
      return null;
    }

    if (!NAME_REGEX.test(profile.first_name) || !NAME_REGEX.test(profile.last_name)) {
      return "Please enter a valid first and last name.";
    }
    if (!EMAIL_REGEX.test(profile.email)) {
      return "Please enter a valid email address.";
    }
    if (!PHONE_REGEX.test(profile.phone_number)) {
      return "Please enter a valid phone number.";
    }

    if (invitationType === "non_members") {
      if (!profile.is_student || profile.is_alumnus) {
        return "This invitation requires student status and does not allow alumni.";
      }
      if (!SCHOOL_TEXT_REGEX.test(profile.study_program)) {
        return "Please enter a valid study program.";
      }
    }

    if (invitationType === "alumni") {
      if (!profile.is_student && !profile.is_alumnus) {
        return "Please confirm student or alumnus status.";
      }
      if (!profile.is_alumnus && !SCHOOL_TEXT_REGEX.test(profile.study_program)) {
        return "Please enter a valid study program.";
      }
    }

    if (invitationType === "all_students") {
      if (!profile.is_student && !profile.is_alumnus) {
        return "Please confirm student or alumnus status.";
      }
      if (!profile.is_alumnus) {
        if (!SCHOOL_TEXT_REGEX.test(profile.university_name)) {
          return "Please enter a valid university name.";
        }
        if (!SCHOOL_TEXT_REGEX.test(profile.study_program)) {
          return "Please enter a valid study program.";
        }
      }
    }

    if (invitationType === "non_students" && profile.is_student) {
      if (!SCHOOL_TEXT_REGEX.test(profile.university_name)) {
        return "Please enter a valid university name.";
      }
      if (!SCHOOL_TEXT_REGEX.test(profile.study_program)) {
        return "Please enter a valid study program.";
      }
    }

    return null;
  };

  const priceTag = (event: events_info) => {
    const price = user ? event.price_member : event.price_nonmember;
    if (user) {
      return <div className="flex flex-wrap items-center gap-x-1.5">
        <span>{price} SEK</span>
        <TouchTooltip
          triggerClassName="inline-flex items-center"
          contentClassName="text-sm"
          content="Member price 🌟"
        >
          <BadgeCheck className="h-4 w-4 text-green-500" />
        </TouchTooltip>
      </div>
    }
    return <span>{price} SEK</span>;
  };

  const getInvitationType = (event?: ExpandedEvent | null) => event?.invitation ?? "non_students";

  const allowsAlumni = (invitationType: string) =>
    invitationType === "alumni" || invitationType === "all_students" || invitationType === "non_students";

  const getRegistrationPrice = (event: ExpandedEvent) => {
    if (isSignedIn) {
      return event.price_member;
    }
    if (registrationProfile.is_alumnus) {
      return event.price_alumnus;
    }
    return event.price_nonmember;
  };

  useEffect(() => {
    const fetchEvents = async () => {  
      try {
        const evs = await apiRequest('/events/current-events');
        const normalized = (evs as ExpandedEvent[]).map((event) => ({
          ...event,
          is_registered: Boolean(event.is_registered) || isSessionRegistered(event.id),
        }));
        setEvents(normalized);
        normalized.forEach((event: ExpandedEvent) => {
          eventCacheRef.current.set(event.id, event);
        });
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch events');
      }
    };

    fetchEvents();
  }, []);

  const handleCardClick = (event: events_info, cardElement: HTMLDivElement) => {
    const rect = cardElement.getBoundingClientRect();
    setCardPosition({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
    setExpandedEventId(event.id);
    setIsClosing(false);
    document.body.style.overflow = "hidden";
  };

  const handleCloseExpanded = () => {
    setIsClosing(true);
    setTimeout(() => {
      setExpandedEventId(null);
      setIsClosing(false);
      document.body.style.overflow = "unset";
    }, 600);
  };

  useEffect(() => {
    if (!expandedEventId) {
      setExpandedEvent(null);
      setExpandedEventPosters([]);
      setIsAlreadyRegistered(false);
      return;
    }

    const fetchExpandedEvent = async () => {
      try {
        const event = await apiRequest(`/events/event-by-id?id=${expandedEventId}`);
        const normalizedEvent = {
          ...event,
          is_registered: Boolean(event.is_registered) || isSessionRegistered(event.id),
        };
        setExpandedEvent(normalizedEvent);
        eventCacheRef.current.set(normalizedEvent.id, normalizedEvent);
      } catch (error: any) {
        toast.error(error.message || "Failed to fetch event");
        setExpandedEvent(null);
      }
    };

    fetchExpandedEvent();
  }, [expandedEventId]);

  useEffect(() => {
    if (!expandedEvent?.poster) {
      setExpandedEventPosters([]);
      return;
    }

    let isCancelled = false;
    const basePath = `/${expandedEvent.poster}`;

    const fetchPosters = async () => {
      try {
        const urls = await loadPosterUrls(basePath);
        if (!isCancelled) {
          setExpandedEventPosters(urls);
        }
      } catch (error: any) {
        if (!isCancelled) {
          setExpandedEventPosters([]);
        }
      }
    };

    fetchPosters();

    return () => {
      isCancelled = true;
    };
  }, [expandedEvent?.poster]);

  const handleSubmitRegistration = async () => {
    if (!expandedEvent) {
      return;
    }
    if (isAlreadyRegistered) {
      return;
    }

    setIsSubmittingRegistration(true);
    try {
      const invitationType = getInvitationType(expandedEvent);
      let profilePayload = {
        ...registrationProfile,
        study_program: registrationProfile.study_program || null,
      };

      if (!isSignedIn) {
        const requiresStudent =
          invitationType === "non_members" || invitationType === "alumni" || invitationType === "all_students";
        const shouldLockToLund = invitationType === "non_members" || invitationType === "alumni";

        if (!profilePayload.first_name || !profilePayload.last_name || !profilePayload.email || !profilePayload.phone_number || !profilePayload.gender) {
          toast.error("Please fill in all required personal details.");
          setIsSubmittingRegistration(false);
          return;
        }

        if (!allowsAlumni(invitationType)) {
          profilePayload.is_alumnus = false;
        }

        if (profilePayload.is_alumnus) {
          profilePayload.is_student = false;
          profilePayload.study_program = null;
          if (shouldLockToLund) {
            profilePayload.university_name = "Lund University";
          }
        } else {
          if (requiresStudent) {
            if (!profilePayload.is_student) {
              toast.error("Student status is required for this invitation type.");
              setIsSubmittingRegistration(false);
              return;
            }
          }

          if (profilePayload.is_student) {
            if (shouldLockToLund) {
              profilePayload.university_name = "Lund University";
            }
            if (!profilePayload.study_program) {
              toast.error("Study program is required.");
              setIsSubmittingRegistration(false);
              return;
            }
            if (invitationType === "all_students" || invitationType === "non_students") {
              if (!profilePayload.university_name) {
                toast.error("University name is required for students.");
                setIsSubmittingRegistration(false);
                return;
              }
            }
          } else {
            profilePayload.study_program = null;
          }
        }
      }

      const answers = (expandedEvent.form_fields || [])
        .map((field) => {
          const rawValue = fieldAnswers[field.id];
          if (field.field_type === "short_text") {
            return {
              field_id: field.id,
              short_text_value: typeof rawValue === "string" ? rawValue : "",
            };
          }
          if (field.field_type === "radio_single") {
            return {
              field_id: field.id,
              selected_option_value: typeof rawValue === "string" ? rawValue : "",
            };
          }
          return {
            field_id: field.id,
            selected_options_json: Array.isArray(rawValue) ? rawValue : [],
          };
        })
        .filter((answer) => {
          if ('short_text_value' in answer) {
            return Boolean(answer.short_text_value?.trim());
          }
          if ('selected_option_value' in answer) {
            return Boolean(answer.selected_option_value);
          }
          return Array.isArray(answer.selected_options_json) && answer.selected_options_json.length > 0;
        });

      const profileRegexError = getProfileRegexError(profilePayload, invitationType, isSignedIn);
      if (profileRegexError) {
        toast.error(profileRegexError);
        setIsSubmittingRegistration(false);
        return;
      }

      await apiRequest(`/events/${expandedEvent.id}/register`, 'POST', {
        profile: profilePayload,
        answers,
      });

      toast.success('Registration submitted successfully');
      setIsAlreadyRegistered(true);
      markSessionRegistered(expandedEvent.id);
      setEvents((prev) => prev.map((event) => (
        event.id === expandedEvent.id ? { ...event, is_registered: true } : event
      )));
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit registration');
    } finally {
      setIsSubmittingRegistration(false);
    }
  };

  const isFormReadyForSubmission = () => {
    if (!expandedEvent || isSubmittingRegistration || isAlreadyRegistered) {
      return false;
    }

    const invitationType = getInvitationType(expandedEvent);
    if (getProfileRegexError(registrationProfile, invitationType, isSignedIn)) {
      return false;
    }

    for (const field of expandedEvent.form_fields || []) {
      if (!field.is_required) {
        continue;
      }
      const value = fieldAnswers[field.id];
      if (field.field_type === "short_text") {
        if (typeof value !== "string" || !value.trim()) {
          return false;
        }
      } else if (field.field_type === "radio_single") {
        if (typeof value !== "string" || !value) {
          return false;
        }
      } else if (!Array.isArray(value) || value.length === 0) {
        return false;
      }
    }

    if (isSignedIn) {
      return true;
    }

    if (!registrationProfile.first_name || !registrationProfile.last_name || !registrationProfile.email || !registrationProfile.phone_number || !registrationProfile.gender) {
      return false;
    }

    if (invitationType === "non_members") {
      return registrationProfile.is_student && !registrationProfile.is_alumnus && Boolean(registrationProfile.study_program.trim());
    }

    if (invitationType === "alumni") {
      if (!registrationProfile.is_student && !registrationProfile.is_alumnus) {
        return false;
      }
      if (registrationProfile.is_alumnus) {
        return true;
      }
      return Boolean(registrationProfile.study_program.trim());
    }

    if (invitationType === "all_students") {
      if (!registrationProfile.is_student && !registrationProfile.is_alumnus) {
        return false;
      }
      if (registrationProfile.is_alumnus) {
        return true;
      }
      return Boolean(registrationProfile.university_name.trim()) && Boolean(registrationProfile.study_program.trim());
    }

    if (invitationType === "non_students") {
      if (!registrationProfile.is_student) {
        return true;
      }
      return Boolean(registrationProfile.university_name.trim()) && Boolean(registrationProfile.study_program.trim());
    }

    return true;
  };

  const renderDynamicField = (field: EventFormField) => {
    if (field.field_type === "short_text") {
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={`field-${field.id}`}>{field.label}{field.is_required ? ' *' : ''}</Label>
          <Input
            id={`field-${field.id}`}
            value={typeof fieldAnswers[field.id] === 'string' ? (fieldAnswers[field.id] as string) : ''}
            onChange={(e) => updateAnswer(field.id, e.target.value)}
            placeholder={field.help_text || ''}
          />
        </div>
      );
    }

    if (field.field_type === "radio_single") {
      return (
        <div key={field.id} className="space-y-2">
          <p className="font-medium text-sm">{field.label}{field.is_required ? ' *' : ''}</p>
          <div className="space-y-2">
            {field.options.map((option) => (
              <label key={option.id} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`field-${field.id}`}
                  checked={fieldAnswers[field.id] === option.value}
                  onChange={() => updateAnswer(field.id, option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div key={field.id} className="space-y-2">
        <p className="font-medium text-sm">{field.label}{field.is_required ? ' *' : ''}</p>
        <div className="space-y-2">
          {field.options.map((option) => {
            const selected = Array.isArray(fieldAnswers[field.id])
              ? (fieldAnswers[field.id] as string[])
              : [];
            const isChecked = selected.includes(option.value);
            return (
              <label key={option.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => toggleCheckboxAnswer(field.id, option.value, Boolean(checked))}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

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
                  <span className="text-xs flex gap-x-1 text-amber-600 mb-1">
                    <Clock className="h-4 w-4" />
                    <p>{new Date(event.deadline).toLocaleString('sv-SE', {dateStyle: "short", timeStyle: "short"})}</p>
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
                  src={`/${event.poster}/0.png`}
                  alt="No poster available"
                  className="aspect-square w-96 rounded-md object-cover"
                  loading="lazy"
                />
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="font-medium">{priceTag(event)}</div>
                <Button
                  variant={event.is_registered ? "outline" : "default"}
                  className={event.is_registered ? "border-green-600 text-green-600 hover:bg-green-50" : ""}
                  disabled={Boolean(event.is_registered)}
                >
                  {event.is_registered ? (
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Registered!
                    </span>
                  ) : (
                    "Register Now"
                  )}
                </Button>
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
      >
        {expandedEvent && (
          <div className="expanded-card-layout">
            <h2 className="text-3xl font-bold mb-4">{expandedEvent.title}</h2>
            <div className="flex flex-wrap items-center gap-y-1 text-lg text-muted-foreground mb-3">
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
                    <DropdownMenuItem asChild>
                      <a href={buildIcsDownloadUrl(expandedEvent)}>
                        Download .ics
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center text-lg text-muted-foreground mb-3">
              <MapPin className="h-5 w-5 mr-3" />
              {formatAddress(expandedEvent.address)}
            </div>
            {invitation(expandedEvent, true)}
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
                isSignedIn={isSignedIn}
                user={user}
                onRegistered={(eventId) => {
                  markSessionRegistered(eventId);
                  setEvents((prev) => prev.map((event) => (
                    event.id === eventId ? { ...event, is_registered: true } : event
                  )));
                  setExpandedEvent((prev) => (
                    prev && prev.id === eventId ? { ...prev, is_registered: true } : prev
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
