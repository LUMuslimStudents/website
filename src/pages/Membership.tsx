
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Users, Calendar, LifeBuoy } from "lucide-react";
import { FAQ } from "@/components/FAQ";
import { Testimonials } from "@/components/Testimonials";
import MembershipHero from "@/components/membership/MembershipHero";
import MembershipPlan from "@/components/membership/MembershipPlan";
import BenefitCard from "@/components/membership/BenefitCard";

const Membership = () => {
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
      <main className="flex-1 relative">
        <AuroraBackground />
        <div className="container relative z-10 pt-24 md:pt-28 pb-8">
          <MembershipHero />
        
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
          <MembershipPlan />
        </div>
        </div>
      </main>
      <FAQ />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Membership;
