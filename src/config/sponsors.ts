/**
 * Sponsors & partners — single source of truth.
 *
 * To add or update a sponsor, edit this file only. No component changes needed.
 * (Planned upgrade: an admin CMS in the dashboard will write to the same data
 * source — this file is the static seed for that.)
 */

/** The three partnership types (see the sponsor pitch). */
export type SponsorTier = "collaboration" | "advertising" | "partnership";

export interface Sponsor {
  /** Display name — also the alt text when a logo is present. */
  name: string;
  /** Partnership type. Determines which group the sponsor is shown under. */
  tier: SponsorTier;
  /** External URL. Omit to show the logo/name without a link. */
  url?: string;
  /** Logo image path (place in /public). Falls back to the name as text. */
  logo?: string;
}

/** Tier display metadata — used by the section and, later, the pitch page. */
export const SPONSOR_TIERS: Record<
  SponsorTier,
  { label: string; description: string }
> = {
  collaboration: {
    label: "Collaboration",
    description: "Donating goods, co-organizing events, or sponsoring a sum of money.",
  },
  advertising: {
    label: "Advertising",
    description: "Reach our student community through targeted visibility.",
  },
  partnership: {
    label: "Partnership",
    description: "Longer-term ongoing support of the association.",
  },
};

/**
 * ── Sponsors list ──────────────────────────────────────────────────────────
 * Example entries:
 *   { name: "Example Corp", tier: "partnership", url: "https://example.com", logo: "/logos/example-corp.png" },
 *   { name: "Local Restaurant", tier: "collaboration" },
 * While empty, the whole section is hidden on the landing page.
 */
export const SPONSORS: Sponsor[] = [
    {
        name: "Lund Mosque (IKC)",
        tier: "partnership",
        url: "https://ikclund.se",
        logo: "/sponsors/IKC_logo.webp"
    }
];
