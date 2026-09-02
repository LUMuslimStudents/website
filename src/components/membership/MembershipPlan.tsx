import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Lock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  MembershipPlanId,
  MembershipStatus,
} from "@/hooks/useMembershipStatus";

interface MembershipPlanProps {
  status: MembershipStatus | null;
  loading: boolean;
}

const MembershipPlan = ({ status, loading }: MembershipPlanProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { checkoutRequired?: boolean } };
  const checkoutRequired = Boolean(location.state?.checkoutRequired);

  const [plan, setPlan] = useState<MembershipPlanId>("single_term");
  const [submitting, setSubmitting] = useState(false);

  const priceSingle = status?.priceSingleTerm ?? 150;
  const priceTwo = status?.priceTwoTerm ?? 300;
  const savings = Math.max(0, priceSingle * 2 - priceTwo);
  const term = status?.term;
  const paid = Boolean(status?.paid);
  // Unknown status → assume open; the backend still enforces everything.
  const membershipOpen = status ? status.membershipOpen : true;

  const handlePay = async () => {
    if (!user) {
      navigate("/signup", { state: { plan, from: "/membership" } });
      return;
    }
    setSubmitting(true);
    try {
      const { url } = await apiRequest("/membership/checkout", "POST", { plan });
      window.location.assign(url);
    } catch (error: any) {
      toast.error(
        error?.message || "Could not start the payment. Please try again."
      );
      setSubmitting(false);
    }
  };

  const features = [
    "Member-only events and activities",
    "Reduced price on paid events",
    "Vote and suggest motions at the annual meeting",
    "Volunteer and board opportunities",
  ];

  const busy = submitting || authLoading || loading;

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/60 shadow-soft backdrop-blur-sm">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="border-b border-border/70 px-6 py-5 text-center md:px-8">
        <h3 className="font-display text-2xl tracking-tight">
          Choose your plan
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {term
            ? `Membership runs for the current term — ${term}.`
            : "Membership runs for the current term."}
        </p>
      </div>

      <div className="px-6 py-6 md:px-8 md:py-8">
        {checkoutRequired && !paid && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Please complete your membership payment to continue.
          </div>
        )}

        {busy ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : paid ? (
          /* ── Paid member ─────────────────────────────────────── */
          <div className="flex flex-col items-center py-2 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
              <Check className="h-7 w-7" />
            </span>
            <p className="mt-4 font-display text-xl tracking-tight">
              Your membership is active
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {term
                ? `Paid for ${term} — welcome to LUMS!`
                : "Thanks for being a member!"}
            </p>
            <ul className="mt-6 w-full max-w-sm space-y-3 text-left">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          /* ── Sign-up flow ────────────────────────────────────── */
          <>
            {!membershipOpen && (
              <div className="mb-6 rounded-xl border border-border/70 bg-muted/40 px-5 py-4 text-center text-sm text-muted-foreground">
                Membership is currently closed
                {term ? ` for ${term}` : ""}. It opens again at the start of the
                next term — come back then to sign up.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Single term */}
              <button
                type="button"
                onClick={() => setPlan("single_term")}
                className={cn(
                  "relative rounded-2xl border-2 px-5 py-4 text-left transition-colors",
                  plan === "single_term"
                    ? "border-primary bg-primary/5"
                    : "border-border/70 bg-background/40 hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Single term</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      One semester
                    </p>
                  </div>
                  <span className="text-lg font-bold">{priceSingle} SEK</span>
                </div>
              </button>

              {/* Two terms */}
              <button
                type="button"
                onClick={() => setPlan("two_term")}
                className={cn(
                  "relative rounded-2xl border-2 px-5 py-4 text-left transition-colors",
                  plan === "two_term"
                    ? "border-gold bg-gold/5"
                    : "border-border/70 bg-background/40 hover:border-gold/50"
                )}
              >
                {savings > 0 && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-3 py-0.5 text-xs font-medium text-background shadow-soft">
                    Save {savings} SEK
                  </span>
                )}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Two terms</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Both semesters of the academic year
                    </p>
                  </div>
                  <span className="text-lg font-bold">{priceTwo} SEK</span>
                </div>
              </button>
            </div>

            <ul className="mt-8 space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {!membershipOpen ? (
                <div className="text-center">
                  <Button
                    disabled
                    className="h-12 w-full cursor-not-allowed rounded-full px-8 text-base"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Membership closed
                  </Button>
                </div>
              ) : (
                <Button
                  disabled={busy}
                  onClick={handlePay}
                  className="h-12 w-full rounded-full px-8 text-base shadow-glow transition-all duration-300 ease-organic hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
                >
                  {submitting
                    ? "Opening payment page…"
                    : user
                      ? `Pay ${plan === "two_term" ? priceTwo : priceSingle} SEK`
                      : "Become a member"}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MembershipPlan;
