import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface EmbedProps extends HTMLAttributes<HTMLDivElement> {
  /** The URL to embed inside the iframe. */
  src: string;
  /** Accessible title for the iframe. */
  title?: string;
  /** Tailwind height class for the wrapper. Defaults to a fixed 600px. */
  heightClassName?: string;
  /** Tailwind min-height class for the wrapper. */
  minHeightClassName?: string;
  /** Whether the iframe may enter fullscreen. Defaults to true. */
  allowFullScreen?: boolean;
  glow?: boolean;
}

export const Embed = ({
  src,
  title = "Embedded content",
  heightClassName = "h-[600px]",
  minHeightClassName = "min-h-[300px]",
  allowFullScreen = true,
  glow = true,
  className,
  ...props
}: EmbedProps) => (
  <div
    className={cn(
      glow ? "rounded-2xl overflow-hidden shadow-[0_0_45px_-10px_hsl(var(--primary))] backdrop-blur-sm"
      : "rounded-2xl overflow-hidden backdrop-blur-sm",
      heightClassName,
      minHeightClassName,
      className
    )}
    {...props}
  >
    <iframe
      src={src}
      title={title}
      width="100%"
      height="100%"
      style={{ border: 0 }}
      allowFullScreen={allowFullScreen}
      loading="lazy"
    />
  </div>
);
