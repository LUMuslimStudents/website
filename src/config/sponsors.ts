import type { ComponentType } from "react";
import {
  Handshake,
  HeartHandshake,
  Layers,
  MapPin,
  Megaphone,
  ShieldCheck,
  Users,
} from "lucide-react";

/**
 * Sponsors, partners & collaboration — single source of truth.
 *
 * Everything the landing "Our sponsors" section and the `/collaborate` pitch
 * page render is defined here, so content can be edited without touching any
 * component. (Planned upgrade: an admin CMS in the dashboard will write to the
 * same shapes below — this file is the static seed for that.)
 *
 * A sponsor can hold one or more ROLES — they are NOT mutually exclusive:
 *  - partner       → long-term, ongoing support.
 *  - collaborator  → we've worked together on a one-off basis.
 *  - advertiser    → runs tailored ads with us (shown in its own section).
 * A long-term partner who also advertises is simply `roles: ["partner", "advertiser"]`.
 */

/* ──────────────────────────────────────────────────────────────────────── */
/* Contact                                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

export const COLLABORATION_EMAIL = "muslimskastudenterlu@gmail.com";
export const COLLABORATION_SUBJECT = "Partnership inquiry — LUMS";

/* ──────────────────────────────────────────────────────────────────────── */
/* Social reach — used by the `/collaborate` pitch                         */
/* ──────────────────────────────────────────────────────────────────────── */

export const SOCIALS = {
  instagram: {
    handle: "@muslimstudentslu",
    url: "https://www.instagram.com/muslimstudentslu/",
    /**
     * ⚠️ Update this to your real follower count — it's shown on the pitch page.
     * For a truly live number, an Instagram Graph API token is required (then a
     * small Supabase edge function can sync it automatically).
     */
    followers: 2249,
  },
} as const;

/* ──────────────────────────────────────────────────────────────────────── */
/* ROLES — the ways to work with LUMS (the "tiers")                        */
/* ──────────────────────────────────────────────────────────────────────── */

export type SponsorRole = "partner" | "collaborator" | "advertiser";

export interface SponsorRoleMeta {
  id: SponsorRole;
  label: string;
  /** Plural label used as the landing-page group heading (e.g. "Partners"). */
  pluralLabel: string;
  /** Very short, relationship-focused line for the landing roster (what they do for LUMS). */
  shortDescription: string;
  /** One-line promise shown under the label on the pitch page. */
  tagline: string;
  /** What this relationship actually is. */
  description: string;
  /** What they get out of it (pitch page). */
  benefits: string[];
  /** How their logo is displayed (pitch page + landing). */
  recognition: string;
  /** Button label on the pitch page card. */
  cta: string;
  icon: ComponentType<{ className?: string }>;
  /** Tailwind height class for logos shown at this role on the landing page. */
  logoHeight: string;
  /** Whether this role appears as a group in the landing sponsor roster. */
  onLanding: boolean;
}

export const SPONSOR_ROLES: SponsorRoleMeta[] = [
  {
    id: "partner",
    label: "Partner",
    pluralLabel: "Partners",
    shortDescription: "Our most committed, long-term partners.",
    tagline: "Grow with us over time",
    description:
      "Support the association on an ongoing basis and become a named partner.",
    benefits: [
      "Prominent, permanent placement in our sponsors section",
      "Recognition across our website and communications",
      "Priority collaboration on events and initiatives",
    ],
    recognition: "Prominently at the top of our sponsors section.",
    cta: "Become a partner",
    icon: HeartHandshake,
    logoHeight: "h-32",
    onLanding: true,
  },
  {
    id: "collaborator",
    label: "Collaborator",
    pluralLabel: "Collaborators",
    shortDescription: "Organisations we've worked with on events and initiatives.",
    tagline: "Team up on a one-off project",
    description:
      "Donate goods, co-organise an event, or sponsor a sum of money toward a specific activity.",
    benefits: [
      "Your logo shown in our collaborators wall",
      "Thanks in the event materials",
      "Direct contact with the community you support",
    ],
    recognition: "Together with everyone we've worked with.",
    cta: "Propose a collaboration",
    icon: Handshake,
    logoHeight: "h-20",
    onLanding: true,
  },
  {
    id: "advertiser",
    label: "Advertiser",
    pluralLabel: "Advertisers",
    shortDescription: "Businesses reaching our community with tailored placements.",
    tagline: "Put your brand in front of our audience",
    description:
      "Run a tailored, featured placement across our channels and social media.",
    benefits: [
      "A dedicated placement, kept separate from the sponsor list",
      "Featured reach across our website and social media",
      "Can be combined with being a partner or collaborator",
    ],
    recognition: "In a dedicated, tailored placement of its own.",
    cta: "Start advertising",
    icon: Megaphone,
    logoHeight: "h-20",
    onLanding: false,
  },
];

/* ──────────────────────────────────────────────────────────────────────── */
/* Sponsors list                                                           */
/* ──────────────────────────────────────────────────────────────────────── */

export interface Sponsor {
  /** Display name — also the alt text when a logo is present. */
  name: string;
  /**
   * One or more roles. Non-exclusive — e.g. `["partner", "advertiser"]`.
   * `partner` / `collaborator` show on the landing roster; `advertiser` is
   * reserved for the dedicated ads section.
   */
  roles: SponsorRole[];
  /** External URL. Omit to show the logo/name without a link. */
  url?: string;
  /** Logo image path (place in /public). Falls back to the name as text. */
  logo?: string;
}

/**
 * To add a sponsor, add one entry below. Example:
 *   { name: "Example Corp", roles: ["collaborator"], url: "https://example.com", logo: "/sponsors/example-corp.png" },
 * While empty, the whole landing section is hidden.
 */
export const SPONSORS: Sponsor[] = [
  {
    name: "Lund Mosque (IKC)",
    roles: ["partner"],
    url: "https://ikclund.se",
    logo: "/sponsors/IKC_logo.webp",
  },
];

/* ──────────────────────────────────────────────────────────────────────── */
/* Why partner — highlight cards for the `/collaborate` page               */
/* ──────────────────────────────────────────────────────────────────────── */

export interface PartnerHighlight {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

export const PARTNER_HIGHLIGHTS: PartnerHighlight[] = [
  {
    title: "Values you can stand behind",
    description:
      "A halal, inclusive and community-minded association — your brand is seen supporting something meaningful.",
    icon: ShieldCheck,
  },
  {
    title: "Trusted locally since 2023",
    description:
      "A known and respected name among students and their families across Lund and Skåne.",
    icon: MapPin,
  },
  {
    title: "A loyal, engaged audience",
    description:
      "People who actively support the businesses and causes that support them.",
    icon: Users,
  },
  {
    title: "Simple ways to get involved",
    description:
      "Partner, collaborate or advertise — pick what fits and we'll handle the rest.",
    icon: Layers,
  },
];
