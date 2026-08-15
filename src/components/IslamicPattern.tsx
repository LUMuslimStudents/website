import { cn } from "@/lib/utils";

/**
 * Single eight-pointed star (khatam / rub-el-hizb inspired) with a center dot.
 * Used as an ornamental mark. Inherits `currentColor`.
 */
export const StarMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <polygon points="12,1.4 15.5,8.5 22.6,12 15.5,15.5 12,22.6 8.5,15.5 1.4,12 8.5,8.5" />
    <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Khatam lattice — Umayyad / Levantine star-and-cross tessellation.   */
/*                                                                     */
/* Generated purely in code (no image assets): a chain of regular      */
/* octagons tip-to-tip, each containing an interlaced eight-pointed    */
/* star (two overlapping squares), an inner octagon, and small         */
/* octagon "cross" nodes between them. The classic 4.8.8 tiling        */
/* family seen in the Dome of the Rock and the Great Mosque of         */
/* Damascus. Rendered once as a static SVG <pattern> — zero runtime    */
/* cost after mount. Tint it with text-opacity utilities, e.g.         */
/* `text-foreground/[0.06]`.                                           */
/* ------------------------------------------------------------------ */

type XY = { x: number; y: number };

const TILE = 120;

const toRad = (deg: number) => (deg * Math.PI) / 180;

const polar = (cx: number, cy: number, r: number, angleDeg: number): XY => ({
  x: +(cx + r * Math.cos(toRad(angleDeg))).toFixed(2),
  y: +(cy + r * Math.sin(toRad(angleDeg))).toFixed(2),
});

const ring = (cx: number, cy: number, r: number, offsetDeg = 0, steps = 8): XY[] =>
  Array.from({ length: steps }, (_, i) =>
    polar(cx, cy, r, offsetDeg + (360 / steps) * i)
  );

const fmt = (pts: XY[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");

/* Geometry constants — computed once at module load */
const BIG_R = 44; // octagons at lattice corners + tile center
const BIG_SQUARE_R = 31; // interlaced squares inside big octagons
const BIG_INNER_R = 13; // inner octagon
const SMALL_R = 16; // small octagons at tile edge midpoints
const SMALL_INNER_R = 7; // diamond inside small octagons

const bigNodes: [number, number][] = [
  [0, 0],
  [TILE, 0],
  [0, TILE],
  [TILE, TILE],
  [TILE / 2, TILE / 2],
];

const smallNodes: [number, number][] = [
  [TILE / 2, 0],
  [0, TILE / 2],
  [TILE, TILE / 2],
  [TILE / 2, TILE],
];

const bigOctagons = bigNodes.map(([cx, cy]) => ({
  octagon: ring(cx, cy, BIG_R),
  squareA: ring(cx, cy, BIG_SQUARE_R, 0, 4),
  squareB: ring(cx, cy, BIG_SQUARE_R, 45, 4),
  inner: ring(cx, cy, BIG_INNER_R, 22.5),
}));

const smallOctagons = smallNodes.map(([cx, cy]) => ({
  octagon: ring(cx, cy, SMALL_R),
  diamond: ring(cx, cy, SMALL_INNER_R, 45, 4),
}));

export const KhatamPattern = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <pattern
        id="khatam-lattice"
        width={TILE}
        height={TILE}
        patternUnits="userSpaceOnUse"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {bigOctagons.map((shape, i) => (
            <g key={`big-${i}`}>
              <polygon points={fmt(shape.octagon)} strokeWidth="1.2" />
              <polygon points={fmt(shape.squareA)} strokeWidth="0.9" />
              <polygon points={fmt(shape.squareB)} strokeWidth="0.9" />
              <polygon points={fmt(shape.inner)} strokeWidth="0.8" />
            </g>
          ))}
          {smallOctagons.map((shape, i) => (
            <g key={`small-${i}`}>
              <polygon points={fmt(shape.octagon)} strokeWidth="1" />
              <polygon points={fmt(shape.diamond)} strokeWidth="0.8" />
            </g>
          ))}
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#khatam-lattice)" />
  </svg>
);

interface ArchDividerProps {
  className?: string;
  /** Arches open downward (scalloped edge) instead of upward */
  flipped?: boolean;
}

/**
 * Repeating pointed-arch arcade (ogee style), stroke-only, `currentColor`.
 * Tiles at a fixed pixel size so it never distorts on wide screens.
 */
export const ArchDivider = ({ className, flipped = false }: ArchDividerProps) => (
  <svg
    aria-hidden="true"
    width="100%"
    height="18"
    className={cn("pointer-events-none block w-full", flipped && "rotate-180", className)}
  >
    <defs>
      <pattern
        id="arch-arcade-tile"
        width="24"
        height="18"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M1.5,18 L1.5,7 L12,1.5 L22.5,7 L22.5,18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="8.5" r="1" fill="currentColor" stroke="none" />
      </pattern>
    </defs>
    <rect width="100%" height="18" fill="url(#arch-arcade-tile)" />
  </svg>
);

interface PatternBackgroundProps {
  className?: string;
  /**
   * Tailwind tint classes. The PNG is applied as a mask over a solid color
   * layer, so the tint controls pattern color — theme-adaptive via
   * `bg-foreground` (default), or override with e.g. `bg-white`.
   */
  tintClassName?: string;
}

/**
 * Full-bleed ornamental pattern using the provided raster asset
 * (`/assets/pattern background.png`) as a mask over a tinted layer.
 * Static after mount — zero runtime cost. The tint color follows the
 * theme automatically, so the same asset works in light and dark mode.
 */
export const PatternBackground = ({
  className,
  tintClassName = "opacity-[0.45] dark:opacity-[0.36]",
}: PatternBackgroundProps) => (
  <div
    aria-hidden="true"
    className={cn(
      "pointer-events-none absolute inset-0 bg-foreground",
      tintClassName,
      className
    )}
    style={{
      maskImage: "url('/assets/pattern%20background.png')",
      WebkitMaskImage: "url('/assets/pattern%20background.png')",
      maskRepeat: "repeat",
      WebkitMaskRepeat: "repeat",
      maskSize: "1366px 768px",
      WebkitMaskSize: "1366px 768px",
      maskPosition: "center",
      WebkitMaskPosition: "center",
    }}
  />
);

interface OrnamentDividerProps {
  className?: string;
  /** Classes for the side hairlines (default: fade to foreground at low opacity) */
  lineClassName?: string;
  /** Classes for the central star (default: gold) */
  starClassName?: string;
  /** Whether the star slowly rotates (very subtle, transform-only) */
  animateStar?: boolean;
}

/**
 * Ornamental section divider: hairline — eight-pointed star — hairline.
 */
export const OrnamentDivider = ({
  className,
  lineClassName,
  starClassName,
  animateStar = true,
}: OrnamentDividerProps) => (
  <div
    className={cn("flex items-center justify-center gap-3", className)}
    aria-hidden="true"
  >
    <span
      className={cn(
        "h-px w-12 md:w-16 bg-gradient-to-r from-transparent to-current opacity-30",
        lineClassName
      )}
    />
    <StarMark
      className={cn(
        "h-4 w-4 text-gold",
        animateStar && "animate-spin-slow",
        starClassName
      )}
    />
    <span
      className={cn(
        "h-px w-12 md:w-16 bg-gradient-to-l from-transparent to-current opacity-30",
        lineClassName
      )}
    />
  </div>
);
