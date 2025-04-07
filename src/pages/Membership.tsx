
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Check, Loader2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Calendar, LifeBuoy } from "lucide-react";
import { FAQ } from "@/components/FAQ";
import { Testimonials } from "@/components/Testimonials";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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

const Membership = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

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

  // Check if the user was redirected back from a canceled payment
  const searchParams = new URLSearchParams(location.search);
  const canceled = searchParams.get('canceled') === 'true';

  // Show a toast if payment was canceled
  useEffect(() => {
    if (canceled) {
      toast({
        title: "Payment canceled",
        description: "Your payment was canceled. You can try again when you're ready.",
        variant: "destructive",
      });
    }
  }, [canceled, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setApiError(null);

    try {
      // Create member in the database
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert([
          {
            full_name: values.fullName,
            study_program: values.studyProgram,
            school_email: values.schoolEmail,
            phone_number: values.phoneNumber,
            membership_status: 'pending',
            payment_status: 'pending'
          }
        ])
        .select();

      if (memberError) throw memberError;
      
      if (!member || member.length === 0) {
        throw new Error("Failed to create member record");
      }
      
      // Get the newly created member ID
      const memberId = member[0].id;
      
      // Call the Supabase Edge Function to create a Stripe checkout session
      setIsRedirecting(true);
      
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-checkout', {
        body: {
          memberId,
          memberName: values.fullName,
          memberEmail: values.schoolEmail,
          productName: 'LUMS Membership',
          amount: 10000 // 100 SEK in öre
        }
      });

      if (sessionError) {
        console.error("Stripe session error:", sessionError);
        throw new Error(sessionError.message || "Failed to create payment session");
      }
      
      // Redirect to the Stripe checkout page
      if (sessionData && sessionData.url) {
        window.location.href = sessionData.url;
      } else {
        throw new Error('Failed to create payment session. No redirect URL returned.');
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setApiError(error.message || "An unexpected error occurred. Please try again later.");
      toast({
        title: "Registration failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      setIsLoading(false);
      setIsRedirecting(false);
    }
  };

  const plans = [
    {
      id: 1,
      name: "Student Membership",
      price: "100 SEK",
      period: "per semester",
      features: [
        "Access to all LUMS events",
        "Community WhatsApp group",
        "Weekly newsletters",
        "Event discounts",
      ],
    },
  ];

  const benefits = [
    {
      title: "Community Connection",
      description: "Join a vibrant community of Muslim students",
      icon: Users
    },
    {
      title: "Exclusive Events",
      description: "Get priority access to all LUMS events",
      icon: Calendar
    },
    {
      title: "Support Network",
      description: "Access to mentorship and support services",
      icon: LifeBuoy
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5 py-16 mb-12">
          <div className="container relative z-10">
            <h1 className="text-5xl font-bold text-center mb-4 animate-in slide-in-from-bottom duration-700">
              Join Our Community
            </h1>
            <p className="text-xl text-center text-muted-foreground max-w-2xl mx-auto animate-in slide-in-from-bottom duration-700 delay-200">
              Be part of Lund University's vibrant Muslim community. Connect, learn, and grow together.
            </p>
          </div>
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
        </div>
        <div className="text-center mb-12 animate-in">
          <h1 className="text-4xl font-bold mb-4">Join LUMS</h1>
          <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
            Become part of our vibrant Muslim student community in Lund and enjoy exclusive benefits.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="group p-6 rounded-lg border bg-card hover:shadow-lg transition-all duration-300">
              <benefit.icon className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
        <div className="max-w-[500px] mx-auto relative z-10">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{plans[0].name}</CardTitle>
              <div className="flex items-baseline mt-4">
                <span className="text-3xl font-bold">{plans[0].price}</span>
                <span className="ml-2 text-muted-foreground">{plans[0].period}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plans[0].features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pb-4">
              <Button 
                variant="default"
                className="w-full bg-[#004aac] hover:bg-[#004aac]/90 text-white font-medium py-2"
                onClick={() => setIsOpen(true)}
              >
                Become a Member
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Membership Application</DialogTitle>
            </DialogHeader>
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
          </DialogContent>
        </Dialog>
      </main>
      <FAQ />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Membership;
