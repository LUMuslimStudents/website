import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  flattenNavItems,
  isItemActive,
  type NavCategory,
  type NavItem,
} from "@/config/nav";
import { NavLinkRow, PreviewSlot } from "./shared";

/**
 * Desktop-only dropdown for one nav category. The label is not a link — it only
 * toggles the panel. Opens on hover (with a small intent delay) and on keyboard
 * focus; closes on mouse-leave, Escape, or blur.
 *
 * Layout is two columns: the link list on the left and a fixed-width preview
 * panel on the right that updates as you point at items (no reflow).
 */
export const NavCategoryDropdown = ({ category }: { category: NavCategory }) => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<NavItem | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const items = flattenNavItems(category);
  const isCategoryActive = items.some((item) => isItemActive(item, pathname));

  // Default preview: first item that has a description.
  const preview = activeItem ?? items.find((i) => i.description) ?? null;

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    []
  );

  // Close when focus leaves the whole component (keyboard tab-out).
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onBlur={handleBlur}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={openNow}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200",
          isCategoryActive || open
            ? "text-primary"
            : "text-foreground/80 hover:text-foreground"
        )}
      >
        {category.label}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* pt-3 is the invisible "bridge" so moving from label to panel keeps it open */}
      <div
        className={cn(
          "absolute left-0 top-full z-50 pt-3",
          !open && "pointer-events-none"
        )}
      >
        <div
          role="menu"
          className={cn(
            "grid w-[36rem] grid-cols-[1fr_15rem] gap-3 rounded-2xl border border-border/70 menu-frost p-2.5 shadow-lift",
            "transition-[opacity,transform] duration-200 ease-organic",
            open
              ? "translate-y-0 opacity-100"
              : "-translate-y-1 opacity-0"
          )}
        >
          {/* Left: link list */}
          <div>
            {category.groups.map((group, gi) => (
              <div key={group.label ?? gi} className={cn(gi > 0 && "mt-1")}>
                {group.label && (
                  <p className="px-3 pb-1 pt-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                    {group.label}
                  </p>
                )}
                {group.items.map((item) => (
                  <NavLinkRow
                    key={item.label}
                    item={item}
                    active={isItemActive(item, pathname)}
                    onActivate={setActiveItem}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Right: preview panel */}
          <PreviewSlot item={preview} variant="side" />
        </div>
      </div>
    </div>
  );
};
