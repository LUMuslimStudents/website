
import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type PlanId = "single_term" | "two_term";

type MembershipStatus = {
  loggedIn: boolean;
  term: string | null;
  membershipOpen: boolean;
  priceSingleTerm: number;
  priceTwoTerm: number;
  paid: boolean;
  paidPlan: PlanId | null;
};

const MembershipPlan = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { checkoutRequired?: boolean } };
  const checkoutRequired = Boolean(location.state?.checkoutRequired);

  const [status, setStatus] = useState<MembershipStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [plan, setPlan] = useState<PlanId>("single_term");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await apiRequest("/membership/status", "GET");
        if (!cancelled) setStatus(result);
      } catch {
        // Card still renders with defaults when the status can't be loaded.
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handlePay = async () => {
    if (!user) {
      navigate("/login", { state: { from: "/membership" } });
      return;
    }
    setSubmitting(true);
    try {
      const { url } = await apiRequest("/membership/checkout", "POST", { plan });
      window.location.assign(url);
    } catch (error: any) {
      toast.error(error?.message || "Could not start the payment. Please try again.");
      setSubmitting(false);
    }
  };

  const priceSingle = status?.priceSingleTerm ?? 150;
  const priceTwo = status?.priceTwoTerm ?? 300;

  const features = [
    "Discount on all LUMS events",
    "Community WhatsApp group",
    "Opportunity to volunteer",
    "Support LUMS initiatives",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Student Membership</CardTitle>
        {status?.term && !status.paid && (
          <p className="text-sm text-muted-foreground">Term: {status.term}</p>
        )}
      </CardHeader>
      <CardContent>
        {checkoutRequired && !status?.paid && (
          <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            Please complete your membership payment to continue.
          </div>
        )}

        {authLoading || statusLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : status?.paid ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <Check className="h-5 w-5" />
              <span className="font-medium">
                Your membership for {status.term} is active
              </span>
            </div>
            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-center">
                  <Check className="h-4 w-4 text-primary mr-2" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setPlan("single_term")}
                className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                  plan === "single_term"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div>
                  <p className="font-medium">Single term</p>
                  <p className="text-sm text-muted-foreground">One semester</p>
                </div>
                <span className="text-lg font-bold">{priceSingle} SEK</span>
              </button>

              <button
                type="button"
                onClick={() => setPlan("two_term")}
                className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                  plan === "two_term"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div>
                  <p className="font-medium">Two terms</p>
                  <p className="text-sm text-muted-foreground">
                    Both semesters — save {Math.max(0, priceSingle * 2 - priceTwo)} SEK
                  </p>
                </div>
                <span className="text-lg font-bold">{priceTwo} SEK</span>
              </button>
            </div>

            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-center">
                  <Check className="h-4 w-4 text-primary mr-2" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="pb-4">
        <Button
          variant="default"
          disabled={submitting || authLoading || statusLoading || status?.paid || (status !== null && !status.membershipOpen)}
          className="w-full bg-[#004aac] hover:bg-[#004aac]/90 text-white font-medium py-2"
          onClick={handlePay}
        >
          {submitting
            ? "Opening payment page..."
            : status?.paid
              ? "Membership active"
              : user
                ? `Pay ${plan === "two_term" ? priceTwo : priceSingle} SEK`
                : "Become a member"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MembershipPlan;
