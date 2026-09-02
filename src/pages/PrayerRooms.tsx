import { useState } from "react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider } from "@/components/IslamicPattern";
import { QiblaCompass } from "@/components/QiblaCompass";
import { Embed } from "@/components/ui/embed";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Building2,
  DoorOpen,
  ExternalLink,
  Mail,
  MapPin,
  Video,
} from "lucide-react";

/* ── Content — edit me ──────────────────────────────────────────────────── */

type PrayerRoom = {
  /** Card title, e.g. "Biomedicinskt centrum (BMC)" */
  name: string;
  /** Faculty / building subtitle, shown under the title */
  faculty?: string;
  /** Room number or room name, shown as the badge */
  room: string;
  /** Extra note next to the room badge, e.g. "Hus H" or "Våning 2" */
  roomNote?: string;
  /** Street address — also used to build the Google Maps directions link */
  address: string;
  /** Campus shown on the card */
  campus: "Lund" | "Helsingborg";
  /**
   * Optional walkthrough video. Paste a YouTube (or other) link here to show
   * a "Watch how to get there" button on the card, e.g.
   * videoUrl: "https://www.youtube.com/watch?v=..."
   */
  videoUrl?: string;
};

const PRAYER_ROOMS: PrayerRoom[] = [
  {
    name: "Ekonomihögskolan",
    faculty: "Faculty of Economics",
    room: "EC2:141",
    address: "Tycho Brahes väg 1, Lund",
    campus: "Lund",
    videoUrl: "https://youtube.com/shorts/0qPUto11ITA?si=ZHhhX2NfCuRfQew-"
  },
  {
    name: "Juridicum",
    faculty: "Faculty of Law",
    room: "Pressroom/Tryckeriet",
    roomNote: "2nd Floor",
    address: "Lilla Gråbrödersgatan 3C, Lund",
    campus: "Lund",
    // videoUrl: ""
  },
  {
    // name: "Språk- och litteraturcentrum",
    name: "Language and Literature Center (SOL)",
    faculty: "Joint faculties of Humanities and Theology",
    room: "SOL:A022",
    roomNote: "Basement in Absalon",
    address: "Helgonabacken 12, Lund",
    campus: "Lund",
    videoUrl: "https://youtube.com/shorts/qKKtLfVSSOU?si=x53L0VyXBlf9ptEy"
  },
  {
    name: "Biomedical Center (BMC)",
    faculty: "Faculty of Medicine",
    room: "H1112",
    roomNote: "Hus H",
    address: "Sölvegatan 19, Lund",
    campus: "Lund",
  },
  // {
  //   name: "Universitetssjukhuset",
  //   faculty: "University Hospital (Faculty of Medicine)",
  //   room: "H1112",
  //   roomNote: "Hus H",
  //   address: "Sölvegatan 19, Lund",
  //   campus: "Lund",
  // },
  {
    name: "Campus Helsingborg",
    room: "C229",
    address: "Universitetsplatsen 2, Helsingborg",
    campus: "Helsingborg",
  },
];

/* ── Helpers ────────────────────────────────────────────────────────────── */

/** Convert YouTube links (watch, youtu.be, shorts, live) to an embed URL. */
const toEmbedUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    }
    if (parsed.hostname.endsWith("youtube.com")) {
      if (parsed.pathname.startsWith("/shorts/")) {
        return `https://www.youtube.com/embed/${parsed.pathname.slice("/shorts/".length)}`;
      }
      if (parsed.pathname.startsWith("/embed/")) return url;
      if (parsed.pathname.startsWith("/live/")) {
        return `https://www.youtube.com/embed/${parsed.pathname.slice("/live/".length)}`;
      }
      const v = parsed.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
  } catch {
    /* not a parseable URL — use as-is */
  }
  return url;
};

/** True when the link points to a vertical YouTube Short. */
const isShortUrl = (url: string): boolean => {
  try {
    return new URL(url).pathname.startsWith("/shorts/");
  } catch {
    return false;
  }
};

/* ── Card ───────────────────────────────────────────────────────────────── */

const PrayerRoomCard = ({ room }: { room: PrayerRoom }) => {
  const [videoOpen, setVideoOpen] = useState(false);

  const videoShort = room.videoUrl ? isShortUrl(room.videoUrl) : false;

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    room.address
  )}`;

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card/70 p-6 shadow-soft backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-1 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-border/70 bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {room.campus}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-display leading-snug">{room.name}</h3>
      {room.faculty && (
        <p className="mt-1 text-sm text-muted-foreground">{room.faculty}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
          <DoorOpen className="h-3.5 w-3.5" />
          {room.room}
        </span>
        {room.roomNote && (
          <span className="text-xs text-muted-foreground">{room.roomNote}</span>
        )}
      </div>

      <a
        href={directionsUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground"
      >
        <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
        {room.address}
        <ExternalLink className="h-3.5 w-3.5 opacity-60" />
      </a>

      {room.videoUrl && (
        <>
          <button
            type="button"
            onClick={() => setVideoOpen(true)}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            <Video className="h-4 w-4" />
            Watch how to get there
          </button>

          <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
            <DialogContent
              className={cn(
                "overflow-hidden border-border/70 bg-card p-0 sm:rounded-2xl",
                videoShort ? "max-w-sm" : "max-w-2xl"
              )}
            >
              <div className="flex flex-col gap-1 px-6 pb-4 pt-5 pr-12">
                <DialogTitle className="font-display text-lg leading-snug">
                  {room.name}
                </DialogTitle>
                <DialogDescription>
                  Video guide to the prayer room
                </DialogDescription>
              </div>
              {videoShort ? (
                /* Portrait player — vertical Shorts fill the frame instead
                   of being squeezed into a tiny 16:9 strip */
                <div className="flex items-center justify-center px-6 pb-6">
                  <iframe
                    src={toEmbedUrl(room.videoUrl)}
                    title={`Video guide to the prayer room at ${room.name}`}
                    className="aspect-[9/16] h-[72vh] w-auto max-w-full rounded-xl"
                    style={{ border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={toEmbedUrl(room.videoUrl)}
                    title={`Video guide to the prayer room at ${room.name}`}
                    className="h-full w-full"
                    style={{ border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

/* ── Page ───────────────────────────────────────────────────────────────── */

const PrayerRooms = () => {
  return (
    <div className="min-h-dvh flex flex-col page">
      <Navbar overlay />
      <main className="flex-1 relative">
        <AuroraBackground />
        <div className="container relative z-10 pt-28 md:pt-36 pb-14 md:pb-20">
          <Reveal className="text-center">
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
              Lund &amp; Helsingborg Campus
            </span>
            <h1 className="mt-3 text-4xl md:text-5xl font-display tracking-tight">
              Prayer Rooms
            </h1>
            <OrnamentDivider className="mt-5" />
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
              Quiet, dedicated spaces to pray across Lund University — no
              booking needed. The rooms are shared by all students, so please
              be considerate and leave them as you found them.
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {PRAYER_ROOMS.map((room, i) => (
              <Reveal key={room.name} delay={i * 80} className="h-full">
                <PrayerRoomCard room={room} />
              </Reveal>
            ))}

            {/* Fill-in CTA card so the grid always ends on a full row */}
            {/* <Reveal
              delay={PRAYER_ROOMS.length * 80}
              className="h-full"
            >
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/40 p-6 text-center">
                <p className="text-sm font-medium">
                  Can&apos;t find your faculty?
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Let us know and we&apos;ll add it to the list.
                </p>
                <a
                  href="mailto:muslimskastudenterlu@gmail.com"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-4 py-2 text-sm font-medium transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                  <Mail className="h-4 w-4" />
                  Send us an email
                </a>
              </div>
            </Reveal> */}
          </div>

          <Reveal delay={150}>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Opening hours follow each building&apos;s schedule — always check
              the entrance or the building&apos;s website before heading out.
            </p>
          </Reveal>

          {/* Qibla — which way to face */}
          <Reveal delay={120}>
            <section className="mt-12 overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm md:p-10">
              <div className="flex flex-col items-center text-center">
                <h2 className="font-display text-2xl md:text-3xl">
                  Qibla in Lund
                </h2>
                <OrnamentDivider className="mt-4" />
                <QiblaCompass
                  bearing={139.1}
                  locationLabel="Lund"
                  className="mt-8"
                />
              </div>
            </section>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrayerRooms;