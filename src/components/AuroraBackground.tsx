import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { PatternBackground } from "@/components/IslamicPattern";

interface AuroraBackgroundProps {
  className?: string;
  /** "soft" for pages, "strong" for the hero */
  intensity?: "soft" | "strong";
  /** Overlay a faint ornamental pattern on top of the washes */
  pattern?: boolean;
  /** Include the jade (green) wash — reserved for the hero section */
  jade?: boolean;
}

/**
 * Luma-inspired soft aurora washes: blurred radial blobs that swim across
 * the whole section on their own fluid loops (aurora-drift-a..d keyframes),
 * plus a liquid reaction to the cursor driven by Framer Motion springs.
 * Each blob drifts with its own depth, stretches toward the pointer
 * (proximity) and stretches further when the cursor moves fast (velocity).
 * All motion is transform-only — GPU-composited, no re-renders per frame.
 */
export const AuroraBackground = ({
  className,
  intensity = "soft",
  pattern = true,
  jade = false,
}: AuroraBackgroundProps) => {
  const strong = intensity === "strong";
  const prefersReducedMotion = useReducedMotion();

  // Cursor position, normalized to [-1, 1], smoothed with slow springs
  // for a watery glide (slightly underdamped for a subtle organic wobble).
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 70, damping: 16, mass: 1 });
  const my = useSpring(rawY, { stiffness: 70, damping: 16, mass: 1 });

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (typeof window.matchMedia === "function") {
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
      if (!fine.matches) return;
    }

    const onMove = (event: MouseEvent) => {
      rawX.set((event.clientX / window.innerWidth) * 2 - 1);
      rawY.set((event.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [prefersReducedMotion, rawX, rawY]);

  return (
    <div className={cn("aurora", className)} aria-hidden="true">
      <BlobSwimmer
        mx={mx}
        my={my}
        depth={30}
        disabled={Boolean(prefersReducedMotion)}
        style={{
          width: "min(62vw, 780px)",
          height: "min(62vw, 780px)",
          top: "-22%",
          left: "-12%",
        }}
      >
        <div
          className="aurora-blob"
          style={{
            background: `radial-gradient(circle at center, hsl(var(--aurora-1) / ${strong ? 0.42 : 0.3}) 0%, transparent 66%)`,
            animationName: "aurora-drift-a",
            animationDuration: "16s",
            animationDelay: "0s",
          }}
        />
      </BlobSwimmer>
      <BlobSwimmer
        mx={mx}
        my={my}
        depth={56}
        disabled={Boolean(prefersReducedMotion)}
        style={{
          width: "min(50vw, 640px)",
          height: "min(50vw, 640px)",
          top: "2%",
          right: "-16%",
        }}
      >
        <div
          className="aurora-blob"
          style={{
            background: `radial-gradient(circle at center, hsl(${jade ? "var(--aurora-2)" : "var(--aurora-3)"} / ${strong ? 0.34 : 0.24}) 0%, transparent 66%)`,
            animationName: "aurora-drift-b",
            animationDuration: "21s",
            animationDelay: "-4s",
          }}
        />
      </BlobSwimmer>
      <BlobSwimmer
        mx={mx}
        my={my}
        depth={44}
        disabled={Boolean(prefersReducedMotion)}
        style={{
          width: "min(48vw, 620px)",
          height: "min(48vw, 620px)",
          bottom: "-28%",
          left: "22%",
        }}
      >
        <div
          className="aurora-blob"
          style={{
            background: `radial-gradient(circle at center, hsl(var(--aurora-3) / ${strong ? 0.42 : 0.3}) 0%, transparent 66%)`,
            animationName: "aurora-drift-c",
            animationDuration: "18s",
            animationDelay: "-9s",
          }}
        />
      </BlobSwimmer>
      <BlobSwimmer
        mx={mx}
        my={my}
        depth={70}
        disabled={Boolean(prefersReducedMotion)}
        style={{
          width: "min(34vw, 440px)",
          height: "min(34vw, 440px)",
          top: "-8%",
          right: "12%",
        }}
      >
        <div
          className="aurora-blob"
          style={{
            background: `radial-gradient(circle at center, hsl(var(--aurora-3) / ${strong ? 0.3 : 0.2}) 0%, transparent 70%)`,
            animationName: "aurora-drift-d",
            animationDuration: "23s",
            animationDelay: "-13s",
          }}
        />
      </BlobSwimmer>
      {pattern && <PatternBackground />}
      {/* Melt the washes into the page background at the bottom */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
};

interface BlobSwimmerProps {
  /** Smoothed cursor position in [-1, 1] */
  mx: MotionValue<number>;
  my: MotionValue<number>;
  /** Parallax depth in px — larger = more travel per cursor unit */
  depth: number;
  /** Interaction disabled (reduced motion) */
  disabled: boolean;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * One fluid blob layer. Measures its own center once, then derives:
 * - translate: spring cursor * depth
 * - rotation: toward the cursor
 * - scaleX/scaleY: area-preserving stretch from proximity + cursor speed
 */
const BlobSwimmer = ({ mx, my, depth, disabled, style, children }: BlobSwimmerProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [center, setCenter] = useState({ cx: 0, cy: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCenter({
      cx: ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1,
      cy: ((rect.top + rect.height / 2) / window.innerHeight) * 2 - 1,
    });
  }, []);

  // Proximity to the cursor (0..1), spring-smoothed with a lively wobble
  const proximity = useTransform([mx, my], (latest: number[]) => {
    const [x, y] = latest;
    const dist = Math.hypot(x - center.cx, y - center.cy);
    return Math.max(0, 1 - dist / 1.35);
  });
  const proxSpring = useSpring(proximity, { stiffness: 140, damping: 10, mass: 0.6 });

  // Cursor speed adds a velocity-based stretch
  const vx = useVelocity(mx);
  const vy = useVelocity(my);
  const speed = useTransform([vx, vy], (latest: number[]) => Math.hypot(latest[0], latest[1]));

  const scaleX = useTransform([proxSpring, speed], (latest: number[]) => {
    const [p, s] = latest;
    return 1 + 0.3 * p + Math.min(s, 8) * 0.02;
  });
  const scaleY = useTransform([proxSpring, speed], (latest: number[]) => {
    const [p, s] = latest;
    return 1 / (1 + 0.3 * p + Math.min(s, 8) * 0.02);
  });

  const x = useTransform(mx, (v) => v * depth);
  const y = useTransform(my, (v) => v * depth);

  if (disabled) {
    return (
      <div ref={ref} className="aurora-fluid" style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className="aurora-fluid"
      style={{ ...style, x, y, scaleX, scaleY }}
    >
      {children}
    </motion.div>
  );
};
