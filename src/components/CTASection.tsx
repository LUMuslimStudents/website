import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/ui/nav-link";
import { ArrowRight } from "lucide-react";
import { PatternBackground, OrnamentDivider } from "@/components/IslamicPattern";
import { Reveal } from "@/components/Reveal";

export const CTASection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary to-[hsl(222,80%,26%)] px-6 py-16 md:py-20 text-center text-primary-foreground shadow-lift grain">
            <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-gold/25 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-gold/20 blur-3xl" aria-hidden="true" />
            <PatternBackground tintClassName="bg-white opacity-[0.24]" />
            <div className="relative z-10">
              <OrnamentDivider
                className="mb-7 text-white"
                lineClassName="opacity-40"
                starClassName="text-gold"
              />
              <h2 className="mx-auto max-w-2xl text-3xl md:text-5xl font-display tracking-tight text-balance">
                Join Our Growing Community
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg opacity-90 text-balance">
                Be part of something meaningful. Connect with fellow Muslim students and grow together.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-9 h-12 rounded-full bg-white px-8 text-[hsl(215,88%,34%)] hover:bg-white/90 shadow-lift transition-all duration-300 ease-organic hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <NavLink to="/membership" className="flex items-center gap-2">
                  Become a Member
                  <ArrowRight className="h-4 w-4" />
                </NavLink>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}; 