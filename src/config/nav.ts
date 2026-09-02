import type { ComponentType } from "react";
import {
  Calendar,
  Compass,
  FileText,
  GraduationCap,
  Heart,
  HeartHandshake,
  History,
  Info,
  Map,
  MapPin,
  Megaphone,
  Target,
  Mosque
} from "lucide-react";
import { FaLinkedin, FaWhatsapp } from "react-icons/fa6";

/** Any icon component that accepts a `className` (lucide-react or react-icons). */
export type NavIcon = ComponentType<{ className?: string }>;

/**
 * A single navigable link inside a category.
 * `description` powers the shared "preview slot" in the navbar (desktop hover /
 * mobile press-to-peek). Keep it short (~4–8 words) and only add it where it
 * genuinely clarifies a non-obvious label.
 */
export interface NavItem {
  label: string;
  /**
   * Route path or external URL. Required for actual links — omit only on
   * expandable parents that define `children` instead (e.g. "WhatsApp groups").
   */
  to?: string;
  icon: NavIcon;
  description?: string;
  /** External links open in a new tab and skip the in-app page transition. */
  external?: boolean;
  /**
   * Nested links revealed when this item is expanded. An item with `children`
   * renders as an expander row and never navigates itself.
   */
  children?: NavItem[];
}

/**
 * A group of items within a category. An optional `label` renders as a small
 * subsection header (e.g. the "Connect" group inside Resources). Most
 * categories have a single headerless group.
 */
export interface NavGroup {
  label?: string;
  items: NavItem[];
}

/** A top-level navbar category. The label is NOT clickable — it only opens the dropdown. */
export interface NavCategory {
  label: string;
  groups: NavGroup[];
}

/**
 * Navbar information architecture — the single source of truth for both the
 * desktop dropdowns and the mobile sheet. To add a link later, add an entry
 * here; no component changes needed.
 *
 * NOTE: several target routes do not exist yet and will hit the 404 page until
 * their pages are built (About, by-laws, resource pages, partners, donate,
 * campaigns, past events). This is expected for this iteration.
 */
export const navCategories: NavCategory[] = [
  {
    label: "Our Association",
    groups: [
      {
        items: [
          {
            label: "About LUMS",
            to: "/about",
            icon: Info,
            description:
              "Get to know who we are, the people behind LUMS, and what we stand for.",
          },
          {
            label: "Mission",
            to: "/mission",
            icon: Target,
            description:
              "Our purpose, long-term vision, and the values that guide everything we do.",
          },
          {
            label: "By-laws & governance",
            to: "/by-laws",
            icon: FileText,
            description:
              "Read our statutes, meeting protocols, and annual general meeting documents.",
          },
        ],
      },
    ],
  },
  {
    label: "Events",
    groups: [
      {
        items: [
          {
            label: "Upcoming events",
            to: "/events",
            icon: Calendar,
            description:
              "Browse everything we have planned and reserve your spot in a few taps.",
          },
          // {
          //   label: "Past events",
          //   to: "/events/past",
          //   icon: History,
          //   description:
          //     "Look back at the gatherings, talks, and socials we've hosted.",
          // },
        ],
      },
    ],
  },
  {
    label: "Resources",
    groups: [
      {
        items: [
          // {
          //   label: "Living in Lund",
          //   to: "/resources/living-in-lund",
          //   icon: MapPin,
          //   description:
          //     "Practical guides to help you settle into student life in Lund as a Mus                                                       lim.",
          // },
          {
            label: "Prayer times in Lund",
            to: "/resources/prayer-times",
            icon: Mosque,
            description: "See prayer times in Lund. Same times for all 3 mosques in Lund."
          },
          {
            label: "Halal map",
            to: "/resources/halal-map",
            icon: Map,
            description:
              "Find halal restaurants, butchers, and groceries across Lund.",
          },
          {
            label: "Prayer rooms on campus",
            to: "/resources/prayer-rooms",
            icon: Compass,
            description:
              "Locate quiet spaces to pray on and around campus between lectures.",
          },
          // {
          //   label: "Academics & Support",
          //   to: "/resources/academic-support",
          //   icon: GraduationCap,                                                                 
          //   description:
          //     "Study resources, guidance, and support to help you succeed.",
          // },
        ],
      },
      {
        label: "Connect",
        items: [
          {
            label: "WhatsApp groups",
            icon: FaWhatsapp,
            description:
              "Pick the chat for you — main, sisters, or brothers.",
            children: [
              {
                label: "Main chat",
                to: "https://chat.whatsapp.com/BARqqItmRq1HmT53jeJfno",
                icon: FaWhatsapp,
                description: "The main LUMS community chat.",
                external: true,
              },
              {
                label: "Sisters chat",
                to: "https://chat.whatsapp.com/G49FxR8Mm3i4J3E6vfH4dO",
                icon: FaWhatsapp,
                description: "A chat just for sisters to connect. \
                Please be respectful, this is exclusively for sisters.",
                external: true,
              },
              {
                label: "Brothers chat",
                to: "https://chat.whatsapp.com/E7uvf7CqozDFoINdIUb0uk",
                icon: FaWhatsapp,
                description: "A chat just for brothers to connect. \
                Please be respectful, this is exclusively for brothers.",
                external: true,
              },
            ],
          },
          {
            label: "LinkedIn community",
            to: "https://www.linkedin.com/groups/12774879/",
            icon: FaLinkedin,
            description:
              "Connect with fellow members, alumni, and professionals.",
            external: true,
          },
        ],
      },
    ],
  },
  {
    label: "Collaboration & Partners",
    groups: [
      {
        items: [
          {
            label: "Partner with us",
            to: "/partners",
            icon: HeartHandshake,
            description:
              "Collaborate, advertise, or become a long-term partner of LUMS.",
          },
          {
            label: "Donate",
            to: "/donate",
            icon: Heart,
            description:
              "Support our work directly and help keep LUMS running.",
          },
          // {
          //   label: "Campaigns we support",
          //   to: "/campaigns",
          //   icon: Megaphone,
          //   description:
          //     "Discover the causes and campaigns our community stands behind.",
          // },
        ],
      },
    ],
  },
];

/** Flatten every internal item (including nested children) so we can compute the active category from the URL. */
export const flattenNavItems = (category: NavCategory): NavItem[] =>
  category.groups.flatMap((g) =>
    g.items.flatMap((item) =>
      item.children?.length ? [item, ...item.children] : [item]
    )
  );

/** Is this internal item the current route (exact or nested)? */
export const isItemActive = (item: NavItem, pathname: string): boolean =>
  !!item.to &&
  !item.external &&
  (pathname === item.to || pathname.startsWith(`${item.to}/`));
