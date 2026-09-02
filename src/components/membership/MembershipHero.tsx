
import { Loader2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { StarMark, OrnamentDivider } from "@/components/IslamicPattern";
import { cn } from "@/lib/utils";
import type { MembershipStatus } from "@/hooks/useMembershipStatus";

interface MembershipHeroProps {
  status: MembershipStatus | null;
  loading: boolean;
}

const MembershipHero = ({ status, loading }: MembershipHeroProps) => {
  const term = status?.term;
  const open = Boolean(status?.membershipOpen);

  return (
    <div className="flex flex-col items-center text-center">
      <Reveal>
        <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
          Membership
        </span>
      </Reveal>
      <Reveal delay={100}>
        <h1 className="mt-3 font-display text-4xl md:text-5xl tracking-tight">
          Become a <em className="italic text-gold">member</em>
        </h1>
      </Reveal>
      <Reveal delay={200}>
        <p className="mt-5 max-w-2xl text-lg md:text-xl text-muted-foreground text-balance">
          LUMS is a registered, non-profit student association for Muslim
          students at Lund University. Your membership fee funds our events and
          activities — and unlocks member benefits across the association.
        </p>
      </Reveal>
      <Reveal delay={300}>
        <div className="mt-8">
          {loading ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-1.5 text-sm text-muted-foreground shadow-soft backdrop-blur-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Checking membership…
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm shadow-soft backdrop-blur-sm",
                open
                  ? "border-primary/30 bg-primary/5 text-foreground"
                  : "border-border/70 bg-card/70 text-muted-foreground"
              )}
            >
              <StarMark
                className={cn(
                  "h-3.5 w-3.5",
                  open ? "text-gold" : "text-muted-foreground/60"
                )}
              />
              {open
                ? term
                  ? `Open for ${term}`
                  : "Membership is open"
                : term
                  ? `Closed for ${term} — reopens next term`
                  : "Membership is closed"}
            </span>
          )}
        </div>
      </Reveal>
      <Reveal delay={400}>
        <OrnamentDivider className="mt-8" />
      </Reveal>
    </div>
  );
};

export default MembershipHero;
