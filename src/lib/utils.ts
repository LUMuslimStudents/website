import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * URL slug for an event, derived from its title, e.g.
 * "Networking Night 2026!" -> "networking-night-2026".
 */
export function toEventSlug(title: string) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

/**
 * URL slug segment for an event's term (e.g. "HT26" -> "ht26").
 * Uses the same normalization as toEventSlug so term segments and
 * title segments stay consistent in routes and storage paths.
 */
export function toTermSlug(term?: string | null) {
  return toEventSlug(term ?? "")
}

/**
 * Public detail route for an event: `/events/{term}/{event-name}`.
 * Events are namespaced by term so the same title in different terms
 * gets a distinct, unique URL. Falls back to `/events/{event-name}`
 * (legacy shape) only when no term is present on the payload.
 */
export function toEventRoute(term: string | null | undefined, title: string) {
  const termSlug = toTermSlug(term)
  const nameSlug = toEventSlug(title)
  return termSlug ? `/events/${termSlug}/${nameSlug}` : `/events/${nameSlug}`
}

/**
 * Slug used for an event's poster folder in the Supabase `events` bucket:
 * `{term}-{event-name}` (also stored as events_info.poster). The term
 * prefix keeps the folder unique even if event names repeat across terms.
 */
export function toEventStorageSlug(term: string | null | undefined, title: string) {
  const termSlug = toTermSlug(term)
  const nameSlug = toEventSlug(title) || "event"
  return termSlug ? `${termSlug}-${nameSlug}` : nameSlug
}
