import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls the window to the top on every route change, so navigation always
 * starts at the very top of the new page — for links, navbar items, footer
 * buttons, and programmatic navigate() calls alike.
 *
 * Exceptions:
 * - In-page transitions within the Events page (/events → /events/:slug →
 *   /events/:otherSlug). Events owns its own scroll there (card-anchored
 *   expand animation + deep links) and a jump would break it. As a side
 *   effect, browser-back inside events also keeps its position.
 * - The very first run: lets the browser's native reload scroll-restoration
 *   work instead of force-jumping to the top.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();
  const firstRun = useRef(true);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    const from = prevPathname.current;
    prevPathname.current = pathname;

    const isEventsInternal =
      from.startsWith("/events") && pathname.startsWith("/events");
    if (isEventsInternal) return;

    // Explicit instant jump (CSS scroll-behavior:smooth is for in-page
    // anchors only — route changes should land immediately at the top).
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
};
