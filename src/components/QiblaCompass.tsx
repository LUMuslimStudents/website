import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Compass } from "lucide-react";

/* ── Helpers ───────────────────────────────────────────────────────────── */

type OrientationEvent = DeviceOrientationEvent & {
  /** iOS exposes the compass heading directly (0–360, clockwise from north). */
  webkitCompassHeading?: number;
};

/** 16-wind compass names, clockwise from north. */
const COMPASS_WORDS = [
  "North", "North-northeast", "Northeast", "East-northeast",
  "East", "East-southeast", "Southeast", "South-southeast",
  "South", "South-southwest", "Southwest", "West-southwest",
  "West", "West-northwest", "Northwest", "North-northwest",
];

const COMPASS_SHORT = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

const cardinalWord = (deg: number) =>
  COMPASS_WORDS[Math.round(deg / 22.5) % 16];
const cardinalShort = (deg: number) =>
  COMPASS_SHORT[Math.round(deg / 22.5) % 16];

/* ── Component ─────────────────────────────────────────────────────────── */

interface QiblaCompassProps {
  /** Qibla bearing, degrees clockwise from true north. Lund ≈ 139.1°. */
  bearing?: number;
  /** Place name used in the copy, e.g. "Lund". */
  locationLabel?: string;
  /** Show the "Use my device" live compass toggle. Defaults to true. */
  live?: boolean;
  className?: string;
}

export function QiblaCompass({
  bearing = 139.1,
  locationLabel = "Lund",
  live = true,
  className,
}: QiblaCompassProps) {
  const [heading, setHeading] = useState<number | null>(null);
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [liveError, setLiveError] = useState<"insecure" | "no-sensor" | null>(
    null
  );
  const timeoutRef = useRef<number | null>(null);
  const headingRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const supported =
    typeof window !== "undefined" && "DeviceOrientationEvent" in window;
  /* DeviceOrientation events only fire in secure contexts (https or
     localhost) — over an http LAN address they never arrive, so the
     "no sensor" fallback must not blame the hardware. */
  const secureContext =
    typeof window !== "undefined" && window.isSecureContext;

  const clearSensorTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /** Smooth the raw sensor heading with a low-pass filter and push it to
      React at most once per animation frame. The sensor fires far faster
      than the screen refreshes, and raw readings are noisy — without this
      the card jitters and the readout flickers around the qibla. */
  const handleHeading = useCallback((raw: number) => {
    const prev = headingRef.current;
    if (prev === null) {
      headingRef.current = raw;
    } else {
      // Shortest signed difference handles the 359° → 0° wrap-around.
      const delta = ((raw - prev + 540) % 360) - 180;
      const next = prev + delta * 0.25;
      headingRef.current = ((next % 360) + 360) % 360;
    }
    if (rafRef.current !== null) return; // a frame is already scheduled
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setHeading(headingRef.current);
    });
  }, []);

  const enableLive = useCallback(async () => {
    if (!secureContext) {
      setLiveEnabled(false);
      setLiveError("insecure");
      return;
    }
    const DE = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    // iOS 13+ requires an explicit user-gesture permission prompt.
    if (DE?.requestPermission) {
      try {
        const permission = await DE.requestPermission();
        if (permission !== "granted") return; // stay on the static needle
      } catch {
        return;
      }
    }
    setHeading(null);
    headingRef.current = null;
    setLiveError(null);
    setLiveEnabled(true);
    // If the sensor never reports a heading, the device has no magnetometer.
    timeoutRef.current = window.setTimeout(() => {
      setLiveError("no-sensor");
      setLiveEnabled(false);
    }, 2500);
  }, [secureContext]);

  useEffect(() => {
    if (!liveEnabled) return;
    const onOrientation = (e: OrientationEvent) => {
      let h: number | null = null;
      if (typeof e.webkitCompassHeading === "number") {
        h = e.webkitCompassHeading; // iOS
      } else if (typeof e.alpha === "number") {
        // Android: `alpha` is the z-axis rotation from north (0 = north).
        // Chrome reports it on `deviceorientation` even when `absolute` is
        // false, so don't gate on the flag.
        h = (360 - e.alpha) % 360;
      }
      if (h !== null) {
        handleHeading(h);
        clearSensorTimer();
      }
    };
    window.addEventListener("deviceorientation", onOrientation);
    window.addEventListener("deviceorientationabsolute", onOrientation);
    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("deviceorientationabsolute", onOrientation);
      clearSensorTimer();
    };
  }, [liveEnabled, clearSensorTimer, handleHeading]);

  useEffect(
    () => () => {
      clearSensorTimer();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [clearSensorTimer]
  );

  /* ── Geometry: compass drawn in a 240×240 viewBox, center (120, 120) ── */
  const C = 120;
  const R = 108;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const point = (deg: number, r: number) =>
    [C + r * Math.sin(rad(deg)), C - r * Math.cos(rad(deg))] as const;
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);

  /* Real-compass behaviour: instead of swinging a needle across a static
     dial, the whole card (ticks, labels, qibla star and the needle) turns
     together by −heading, so the needle always points at true north. Line
     the gold star up with the fixed index at the top of the housing to
     face the qibla; without a heading the card rests north-up. */
  const cardRotation = heading !== null ? -heading : 0;
  const offset =
    heading !== null ? ((bearing - heading + 540) % 360) - 180 : 0;
  const facingQibla = heading !== null && Math.abs(offset) < 5;

  return (
    <div className={cn("flex flex-col items-center gap-5", className)}>
      <div className="w-full max-w-[240px]">
        <svg
          viewBox="0 0 240 240"
          role="img"
          aria-label={`Qibla compass for ${locationLabel}: face ${Math.round(
            bearing
          )}° from true north, ${cardinalWord(bearing).toLowerCase()}`}
          className="h-auto w-full select-none"
        >
          {/* Dial */}
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            strokeWidth={1.5}
          />
          <circle
            cx={C}
            cy={C}
            r={R - 2}
            fill="none"
            stroke="hsl(var(--border))"
            strokeOpacity={0.45}
            strokeWidth={5}
          />

          {/* Rotating card — ticks, labels, qibla star and the needle turn
              together like a real compass card, so the needle always points
              at true north. */}
          <g transform={`rotate(${cardRotation} ${C} ${C})`}>
          {/* Degree ticks */}
          {ticks.map((deg) => {
            const major = deg % 30 === 0;
            const [x1, y1] = point(deg, R - (major ? 18 : 13));
            const [x2, y2] = point(deg, R - 3);
            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="hsl(var(--foreground))"
                strokeOpacity={major ? 0.55 : 0.28}
                strokeWidth={major ? 1.5 : 1}
                strokeLinecap="round"
              />
            );
          })}

          {/* Cardinal labels */}
          {["N", "E", "S", "W"].map((label, i) => {
            const [x, y] = point(i * 90, R - 34);
            return (
              <text
                key={label}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(var(--foreground))"
                fontSize={15}
                fontWeight={700}
              >
                {label}
              </text>
            );
          })}
          {["NE", "SE", "SW", "NW"].map((label, i) => {
            const [x, y] = point(i * 90 + 45, R - 34);
            return (
              <text
                key={label}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(var(--foreground))"
                fontSize={9.5}
                fontWeight={600}
                opacity={0.5}
              >
                {label}
              </text>
            );
          })}

          {/* Gold star on the ring marking the qibla bearing. Inlined as
              plain primitives (not a nested <svg> with CSS sizing, which
              renders unreliably inside an SVG viewport). The outer group
              rotates it to the bearing; the star itself is drawn around
              the local origin at radius 98, just inside the ring. */}
          <g transform={`rotate(${bearing} ${C} ${C})`}>
            <g transform={`translate(${C} ${C - 98})`}>
              <polygon
                points="0,-7.1 2.3,-2.3 7.1,0 2.3,2.3 0,7.1 -2.3,2.3 -7.1,0 -2.3,-2.3"
                fill="none"
                stroke="hsl(var(--gold))"
                strokeWidth={1.2}
                strokeLinejoin="round"
              />
              <circle
                cx={0}
                cy={0}
                r={1.4}
                fill="hsl(var(--gold))"
                stroke="none"
              />
            </g>
          </g>

          {/* North needle — drawn pointing at the card's north marker, so
              once the card turns it always points at true north. Attribute
              transforms only — no CSS transform-origin quirks. */}
          <g transform={`translate(${C} ${C})`}>
            <polygon
              points="0,-74 7,-5 0,0 -7,-5"
              fill="hsl(var(--gold))"
            />
            <polygon
              points="0,0 3.5,15 0,25 -3.5,15"
              fill="hsl(var(--foreground))"
              fillOpacity={0.35}
            />
          </g>
          </g>

          {/* Fixed index at the top of the housing — marks the top of the
              phone (your facing direction). Turn until the gold qibla star
              lines up with it. */}
          <g transform={`translate(${C} ${C - (R - 10)})`}>
            <polygon
              points="0,-5 6,4 0,0.5 -6,4"
              fill="hsl(var(--gold))"
            />
          </g>

          {/* Hub */}
          <circle
            cx={C}
            cy={C}
            r={6.5}
            fill="hsl(var(--card))"
            stroke="hsl(var(--gold))"
            strokeWidth={2.5}
          />
        </svg>
      </div>

      {/* Readout */}
      <div className="text-center">
        <p className="font-display text-3xl leading-none">
          {Math.round(bearing)}°
          <span className="ml-2 inline-block align-middle rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 font-sans text-xs font-semibold text-primary">
            {cardinalShort(bearing)} · {cardinalWord(bearing)}
          </span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
          {liveError === "insecure" ? (
            <>
              The live compass needs a secure (HTTPS) connection — it
              won&apos;t work over http on a local network. It does on the
              deployed site or on localhost.
            </>
          ) : liveError === "no-sensor" ? (
            <>
              No compass sensor found — the needle shows the direction from{" "}
              {locationLabel}.
            </>

          ) : liveEnabled && heading === null ? (
            <>Hold your phone flat and turn around slowly…</>
          ) : liveEnabled && heading !== null ? (
            facingQibla ? (
              <span className="font-medium text-primary">
                You&apos;re facing the qibla ✓
              </span>
            ) : (
              <>
                Turn {offset > 0 ? "right" : "left"} about{" "}
                {Math.round(Math.abs(offset))}°
              </>
            )
          ) : (
            <>
              In {locationLabel}, face {bearing}° from true
              north — {cardinalWord(bearing).toLowerCase()}.
            </>
          )}
        </p>
      </div>

      {live &&
        (supported ? (
          <button
            type="button"
            onClick={
              liveEnabled
                ? () => {
                    setLiveEnabled(false);
                    setHeading(null);
                    setLiveError(null);
                  }
                : enableLive
            }
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-muted/40 px-5 py-2.5 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            <Compass className="h-4 w-4" />
            {liveEnabled ? "Stop live compass" : "Use my device"}
          </button>
        ) : (
          <p className="max-w-[220px] text-center text-xs text-muted-foreground">
            A live compass needs a phone with a magnetometer.
          </p>
        ))}
    </div>
  );
}
