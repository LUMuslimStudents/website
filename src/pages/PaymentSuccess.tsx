
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type VerificationState = "loading" | "paid" | "unpaid";

const PaymentSuccess = () => {
  const [state, setState] = useState<VerificationState>("loading");
  const [kind, setKind] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for the auth session to be restored before verifying — calling the
    // edge function without a session would fail right after the Stripe redirect.
    if (authLoading) return;

    let cancelled = false;

    async function verifyPayment() {
      try {
        const searchParams = new URLSearchParams(location.search);
        const sessionId = searchParams.get("session_id");

        if (!sessionId) {
          if (!cancelled) setState("unpaid");
          return;
        }

        // Server-side verification: never trust the URL alone.
        // Retry briefly — the webhook marking the DB row as paid can lag a few
        // seconds behind the Stripe redirect.
        for (let attempt = 0; attempt < 3; attempt++) {
          if (cancelled) return;
          if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
          try {
            const result = await apiRequest(
              `/payment/verify?session_id=${encodeURIComponent(sessionId)}`,
              "GET",
            );
            if (cancelled) return;
            if (result?.paid) {
              setKind(result.kind ?? null);
              setState("paid");
              return;
            }
          } catch (error) {
            console.error("Payment verification attempt failed:", error);
          }
        }

        if (!cancelled) setState("unpaid");
      } catch (error) {
        console.error("Payment verification failed:", error);
        if (!cancelled) setState("unpaid");
      }
    }

    verifyPayment();
    return () => {
      cancelled = true;
    };
  }, [location.search, authLoading]);

  const isEvent = kind === "event";

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar overlay />
      <main className="flex-1 container pt-32 md:pt-36 pb-16 flex justify-center items-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {state === "loading"
                ? "Processing Payment"
                : state === "paid"
                  ? "Payment Successful!"
                  : "Payment Verification Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {state === "loading" ? (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <p>Please wait while we confirm your payment...</p>
              </div>
            ) : state === "paid" ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-green-100 rounded-full p-3">
                  <Check className="h-16 w-16 text-green-600" />
                </div>
                <p className="text-center">
                  {isEvent
                    ? "Your event registration payment was successful. See you there!"
                    : "Thank you! Your LUMS membership payment has been successfully processed."}
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() => navigate(isEvent ? "/events" : "/")}
                >
                  {isEvent ? "Back to Events" : "Return to Home"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-amber-100 rounded-full p-3">
                  <AlertTriangle className="h-16 w-16 text-amber-600" />
                </div>
                <p className="text-center text-destructive">
                  We couldn't verify your payment status. If you completed the payment,
                  give it a moment and reload this page, or contact our support team.
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() => navigate(isEvent ? "/events" : "/membership")}
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
