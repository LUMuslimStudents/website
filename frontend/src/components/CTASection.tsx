import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/ui/nav-link";

export const CTASection = () => {
  return (
    <section className="bg-[#004aac] py-16">
      <div className="container text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-in slide-in-from-bottom">
          Join Our Growing Community
        </h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
          Be part of something meaningful. Connect with fellow Muslim students and grow together.
        </p>
        <Button 
          asChild 
          size="lg" 
          variant="secondary"
          className="bg-white text-[#004aac] hover:bg-white/90 animate-in slide-in-from-bottom delay-200"
        >
          <NavLink to="/membership">Become a Member</NavLink>
        </Button>
      </div>
    </section>
  );
}; 