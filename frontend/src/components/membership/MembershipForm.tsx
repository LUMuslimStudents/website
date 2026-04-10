
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Form validation schema
const formSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  studyProgram: z.string().min(2, { message: "Study program is required." }),
  schoolEmail: z.string().email({ message: "Please enter a valid email." })
    .refine(email => email.endsWith('@student.lu.se'), {
      message: "Please use your @student.lu.se email address"
    }),
  phoneNumber: z.string().min(6, { message: "Valid phone number is required." }),
});

interface MembershipFormProps {
  onClose: () => void;
}

const MembershipForm = ({ onClose }: MembershipFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      studyProgram: '',
      schoolEmail: '',
      phoneNumber: ''
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setApiError(null);

    try {
      console.log("Form submitted with values:", values);

      // Mock registration success for UI flow
      await new Promise(resolve => setTimeout(resolve, 1500));

      setIsRedirecting(true);

      // Since we don't have a backend now, we'll just mock a redirect 
      // or show a success message. For now, let's pretend we're redirecting 
      // to a success page directly.
      setTimeout(() => {
        window.location.href = `/payment-success?session_id=mock_session&member_id=mock_member`;
      }, 1000);

    } catch (error: any) {
      console.error("Registration error:", error);
      setApiError(error.message || "An unexpected error occurred. Please try again later.");
      setIsLoading(false);
      setIsRedirecting(false);
    }
  };

  return (
    <>
      {apiError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isLoading || isRedirecting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="studyProgram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Study Program</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isLoading || isRedirecting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="schoolEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="your.name@student.lu.se"
                    disabled={isLoading || isRedirecting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    disabled={isLoading || isRedirecting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isRedirecting}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : isRedirecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to payment...
              </>
            ) : (
              'Continue to Payment'
            )}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default MembershipForm;
