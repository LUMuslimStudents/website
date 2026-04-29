
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
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

        console.log("Mock Payment verification - Session ID:", sessionId);
        console.log("Mock Payment verification - Member ID:", memberId);

        if (!sessionId || !memberId) {
          console.error("Missing session_id or member_id in URL parameters");
          setSuccess(false);
          setLoading(false);
          return;
        }

        // Mock verification delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Default to success in mock mode
        setSuccess(true);
        setMemberDetails({
          full_name: "Mock Member",
          membership_status: "completed",
          payment_status: "completed"
        });

      } catch (error) {
        console.error("Error in mock payment verification:", error);
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
      <main className="flex-1 pt-32 container py-16 flex justify-center items-center">
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
