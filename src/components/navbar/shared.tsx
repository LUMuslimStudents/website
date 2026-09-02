import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { NavLink } from "@/components/ui/nav-link";
import { cn } from "@/lib/utils";
import type { NavIcon, NavItem } from "@/config/nav";

interface NavLinkRowProps {
  item: NavItem;
  /** Whether this item matches the current route. */
  active?: boolean;
  /** Fires when the user "points at" the row (hover/focus on desktop, press on mobile). */
  onActivate?: (item: NavItem) => void;
  /** Fires after the user commits to navigating (used to close the menu). */
  onNavigate?: () => void;
  className?: string;
}

/** Shared row styling for menu items (expander, internal, external). */
const rowClasses = (active?: boolean) =>
  cn(
    "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm",
    "!transition-colors duration-200 hover:!opacity-100",
    active
      ? "bg-muted font-medium text-primary"
      : "text-foreground/80 hover:bg-muted hover:text-foreground"
  );

/** The rounded icon tile at the start of every menu row. */
const IconBadge = ({ Icon, active }: { Icon: NavIcon; active?: boolean }) => (
  <span
    className={cn(
      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-border/60 transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "bg-gradient-to-br from-primary/10 to-gold/10 text-foreground/70 group-hover:text-foreground"
    )}
  >
    <Icon className="h-4 w-4" />
  </span>
);

/**
 * A single navigable row shared by the desktop dropdown and the mobile sheet.
 * Three kinds of rows:
 *  - expandable items (have `children`) toggle a nested list in place and never
 *    navigate themselves;
 *  - internal links use the app's animated NavLink;
 *  - external links open in a new tab.
 *
 * NOTE: the base NavLink hard-codes `transition-all` + `hover:opacity-80`, which
 * fights our own colour transition and causes a visible flicker. We override both
 * (`!transition-colors`, `hover:!opacity-100`) so only the background/text colour
 * animates.
 */
export const NavLinkRow = ({
  item,
  active,
  onActivate,
  onNavigate,
  className,
}: NavLinkRowProps) => {
  // Expandable parent: chevron row + nested children (e.g. WhatsApp groups).
  if (item.children?.length) {
    return (
      <ExpandableRow
        item={item}
        onActivate={onActivate}
        onNavigate={onNavigate}
        className={className}
      />
    );
  }

  const Icon = item.icon;

  const shared = {
    onMouseEnter: () => onActivate?.(item),
    onFocus: () => onActivate?.(item),
    onPointerDown: () => onActivate?.(item),
    className: cn(rowClasses(active), className),
  };

  const inner = (
    <>
      <IconBadge Icon={Icon} active={active} />
      <span className="truncate">{item.label}</span>
    </>
  );

  // Non-expandable items always carry a destination.
  const to = item.to;
  if (!to) return null;

  if (item.external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onNavigate?.()}
        {...shared}
      >
        {inner}
      </a>
    );
  }

  return (
    <NavLink to={to} onClick={() => onNavigate?.()} {...shared}>
      {inner}
    </NavLink>
  );
};

/**
 * Row that toggles its nested `children` in place. Clicking never navigates —
 * it expands/collapses. Children are rendered recursively through NavLinkRow so
 * they inherit the same hover-preview and navigate-to-close behaviour on both
 * desktop and mobile.
 */
const ExpandableRow = ({
  item,
  onActivate,
  onNavigate,
  className,
}: NavLinkRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = item.icon;

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        onMouseEnter={() => onActivate?.(item)}
        onFocus={() => onActivate?.(item)}
        onPointerDown={() => onActivate?.(item)}
        className={cn(rowClasses(expanded), className)}
      >
        <IconBadge Icon={Icon} active={expanded} />
        <span className="truncate">{item.label}</span>
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="mt-0.5 space-y-0.5">
          {item.children?.map((child) => (
            <NavLinkRow
              key={child.label}
              item={child}
              onActivate={onActivate}
              onNavigate={onNavigate}
              className="pl-8"
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * The shared preview slot. Shows the label + description of whichever item the
 * user is currently pointing at. No icon (it already sits beside the item in the
 * list). Renders at a fixed size so the panel never reflows.
 *
 * - `side` (desktop): fills the right-hand preview column.
 * - `bottom` (mobile): a larger block anchored at the bottom of the sheet.
 */
export const PreviewSlot = ({
  item,
  variant = "side",
  className,
}: {
  item: NavItem | null;
  variant?: "side" | "bottom";
  className?: string;
}) => {
  const large = variant === "bottom";

  return (
    <div
      aria-live="polite"
      className={cn(
        "flex flex-col justify-center rounded-xl border border-border/50 bg-muted/40",
        large ? "min-h-[5rem] px-4 py-3.5" : "h-full px-4 py-4",
        className
      )}
    >
      {item?.description ? (
        <>
          <p
            className={cn(
              "font-medium text-foreground",
              large ? "text-base" : "text-sm"
            )}
          >
            {item.label}
          </p>
          <p
            className={cn(
              "leading-relaxed text-muted-foreground",
              large ? "mt-1 text-sm" : "mt-1.5 text-[0.8rem]"
            )}
          >
            {item.description}
          </p>
        </>
      ) : (
        <p
          className={cn(
            "text-muted-foreground/70",
            large ? "text-sm" : "text-[0.8rem]"
          )}
        >
          Hover or press and hold on an item to preview it.
        </p>
      )}
    </div>
  );
};
