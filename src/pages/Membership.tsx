
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Calendar, LifeBuoy } from "lucide-react";
import { FAQ } from "@/components/FAQ";
import { Testimonials } from "@/components/Testimonials";
import { useToast } from "@/components/ui/use-toast";
import { useLocation } from "react-router-dom";
import MembershipHero from "@/components/membership/MembershipHero";
import TestModeAlert from "@/components/membership/TestModeAlert";
import MembershipPlan from "@/components/membership/MembershipPlan";
import BenefitCard from "@/components/membership/BenefitCard";
import MembershipForm from "@/components/membership/MembershipForm";

const Membership = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const location = useLocation();

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
        <MembershipHero />
        
        {/* Test mode notice */}
        <div className="max-w-[500px] mx-auto mb-6">
          <TestModeAlert />
        </div>
        
        <div className="text-center mb-12 animate-in">
          <h1 className="text-4xl font-bold mb-4">Join LUMS</h1>
          <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
            Become part of our vibrant Muslim student community in Lund and enjoy exclusive benefits.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit) => (
            <BenefitCard
              key={benefit.title}
              title={benefit.title}
              description={benefit.description}
              Icon={benefit.icon}
            />
          ))}
        </div>
        
        <div className="max-w-[500px] mx-auto relative z-10">
          <MembershipPlan onBecomeMember={() => setIsOpen(true)} />
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Membership Application</DialogTitle>
            </DialogHeader>
            <MembershipForm onClose={() => setIsOpen(false)} />
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
