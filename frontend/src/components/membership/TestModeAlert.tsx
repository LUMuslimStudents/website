
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CreditCard } from "lucide-react";

const TestModeAlert = () => {
  return (
    <Alert className="bg-amber-50 border-amber-200">
      <CreditCard className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-700">Stripe Test Mode</AlertTitle>
      <AlertDescription className="text-amber-600">
        This is running in Stripe test mode. Use test card 4242 4242 4242 4242 for payments.
      </AlertDescription>
    </Alert>
  );
};

export default TestModeAlert;
