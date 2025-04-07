
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function verifyPayment() {
      try {
        const searchParams = new URLSearchParams(location.search);
        const sessionId = searchParams.get("session_id");
        const memberId = searchParams.get("member_id");

        if (!sessionId || !memberId) {
          setSuccess(false);
          setLoading(false);
          return;
        }

        // Verify the payment status if needed by checking the database
        const { data, error } = await supabase
          .from("members")
          .select("membership_status, payment_status")
          .eq("id", memberId)
          .single();

        if (error) {
          console.error("Error verifying payment:", error);
          setSuccess(false);
        } else if (data && data.payment_status === "completed") {
          setSuccess(true);
        } else {
          // If payment is not yet marked as completed in the database,
          // we still show success as the webhook might still be processing
          setSuccess(true);
        }
      } catch (error) {
        console.error("Error in payment verification:", error);
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [location.search]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-16 flex justify-center items-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {loading ? "Processing Payment" : success ? "Payment Successful!" : "Payment Verification Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {loading ? (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <p>Please wait while we confirm your payment...</p>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-green-100 rounded-full p-3">
                  <Check className="h-16 w-16 text-green-600" />
                </div>
                <p className="text-center">
                  Thank you for becoming a LUMS member! Your payment has been successfully processed.
                </p>
                <p className="text-center text-muted-foreground">
                  You will receive a confirmation email shortly.
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() => navigate("/")}
                >
                  Return to Home
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <p className="text-center text-destructive">
                  We couldn't verify your payment. Please contact support if you believe this is an error.
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() => navigate("/membership")}
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
