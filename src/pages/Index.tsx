import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { CTASection } from "@/components/CTASection";
import { DonateSection } from "@/components/DonateSection";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { WhyJoin } from "@/components/WhyJoin";
import { Pillars } from "@/components/Pillars";
import { Resources } from "@/components/Resources";
import { Gallery } from "@/components/Gallery";
import { Sponsors } from "@/components/Sponsors";
import { Testimonials } from "@/components/Testimonials";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Reveal } from "@/components/Reveal";
import { StarMark } from "@/components/IslamicPattern";

const Index = () => {
  return (
    <div className="min-h-dvh flex flex-col page">
      <Navbar overlay />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden grain">
          <AuroraBackground intensity="strong" jade />
          <div className="container relative z-10 pt-28 md:pt-32 pb-16 md:pb-28 flex flex-col items-center text-center">
            <Reveal>
              <img
                src="/assets/bismillah.png"
                alt="Bismi Allah"
                className="h-12 md:h-20 mb-16 w-auto drop-shadow-sm dark:invert dark:opacity-80"
              />
              </Reveal>
            <Reveal>
              <img
                src="/logos/LUMS - Banner Logo_Transparent.png"
                alt="LUMS Logo"
                className="h-24 md:h-28 w-auto mb-8 drop-shadow-sm"
              />
            </Reveal>
            <Reveal delay={120}>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-1.5 text-sm text-muted-foreground shadow-soft backdrop-blur-sm">
                <StarMark className="h-3.5 w-3.5 text-gold" />
                Lund University Muslim Students
              </span>
            </Reveal>
            <Reveal delay={220}>
              <h1 className="mt-6 font-display text-4xl md:text-6xl tracking-tight text-balance">
                Welcome to <em className="italic text-gold">our community</em>
              </h1>
            </Reveal>
            <Reveal delay={320}>
              <p className="mt-5 max-w-2xl text-lg md:text-xl text-muted-foreground text-balance">
                Lund University Muslim Students - A community dedicated to supporting Muslim students at Lund University
              </p>
            </Reveal>
            <Reveal delay={420}>
              <div className="mt-9 flex flex-wrap gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full px-8 shadow-glow transition-all duration-300 ease-organic hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
                >
                  <Link to="/membership">
                    Join Us
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-full px-8 border-border/80 bg-card/60 backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-0.5 hover:bg-card hover:shadow-soft active:scale-[0.98]"
                >
                  <Link to="/events">Our Events</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        <UpcomingEvents />
        <WhyJoin />
        <Pillars />
        <Sponsors />
        <Resources />
        {/* <Gallery /> */}
        <Testimonials />
        <DonateSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
