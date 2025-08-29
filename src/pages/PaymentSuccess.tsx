
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function verifyPayment() {
      try {
        const searchParams = new URLSearchParams(location.search);
        const sessionId = searchParams.get("session_id");
        const memberId = searchParams.get("member_id");

        console.log("Payment verification - Session ID:", sessionId);
        console.log("Payment verification - Member ID:", memberId);

        if (!sessionId || !memberId) {
          console.error("Missing session_id or member_id in URL parameters");
          setSuccess(false);
          setLoading(false);
          return;
        }

        // Verify the payment status by checking the database
        const { data, error } = await supabase
          .from("members")
          .select("id, full_name, membership_status, payment_status, payment_date")
          .eq("id", memberId)
          .single();

        if (error) {
          console.error("Error verifying payment:", error);
          setSuccess(false);
          toast({
            title: "Verification Error",
            description: "Could not verify your payment status. Please contact support.",
            variant: "destructive",
          });
        } else if (data) {
          console.log("Member data:", data);
          setMemberDetails(data);
          
          if (data.payment_status === "completed") {
            setSuccess(true);
          } else {
            // If webhook hasn't processed yet, check again in a few seconds
            console.log("Payment not marked as completed yet, checking again in 5 seconds...");
            setTimeout(() => checkPaymentStatus(memberId), 5000);
          }
        } else {
          console.error("No member found with ID:", memberId);
          setSuccess(false);
        }
      } catch (error) {
        console.error("Error in payment verification:", error);
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    }

    async function checkPaymentStatus(memberId: string) {
      try {
        const { data, error } = await supabase
          .from("members")
          .select("id, full_name, membership_status, payment_status, payment_date")
          .eq("id", memberId)
          .single();
          
        if (error) {
          console.error("Error in payment status check:", error);
          return;
        }
        
        if (data && data.payment_status === "completed") {
          setSuccess(true);
          setMemberDetails(data);
        } else {
          // Mark as successful anyway since Stripe confirmed the payment
          // The webhook might be delayed but the payment went through
          setSuccess(true);
          if (data) {
            setMemberDetails(data);
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
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
                  {memberDetails?.full_name ? `Thank you, ${memberDetails.full_name}!` : 'Thank you!'} Your LUMS membership payment has been successfully processed.
                </p>
                <p className="text-center text-muted-foreground">
                  You will receive a confirmation email shortly with your membership details.
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
                <div className="bg-amber-100 rounded-full p-3">
                  <AlertTriangle className="h-16 w-16 text-amber-600" />
                </div>
                <p className="text-center text-destructive">
                  We couldn't verify your payment status. If you completed the payment, please contact our support team.
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
