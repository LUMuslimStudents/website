import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowRight, Calendar, Users, Star, Target, Eye, HeartHandshake } from "lucide-react";
import { Link } from "react-router-dom";
import { CTASection } from "@/components/CTASection";
import { NewsSection } from "@/components/NewsSection";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider, StarMark } from "@/components/IslamicPattern";

const Index = () => {
  const features = [
    {
      title: "Community",
      description: "Connect with fellow Muslim students in Lund",
      icon: Users,
    },
    {
      title: "Events",
      description: "Join our regular gatherings and special occasions",
      icon: Calendar,
    },
    {
      title: "Support",
      description: "Access resources and support network",
      icon: Star,
    },
  ];

  const missionVision = [
    {
      title: "Our Mission",
      description: "To create a supportive and inclusive environment for Muslim students at Lund University, fostering spiritual growth, academic excellence, and community engagement.",
      icon: Target,
    },
    {
      title: "Our Vision",
      description: "To be a leading Muslim student organization that empowers members to thrive in their academic journey while maintaining their Islamic identity and contributing positively to society.",
      icon: Eye,
    },
    {
      title: "Our Values",
      description: "Unity in diversity, academic excellence, spiritual development, community service, and mutual respect.",
      icon: HeartHandshake,
    },
  ];

  return (
    <div className="min-h-dvh flex flex-col page">
      <Navbar overlay />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden grain">
          <AuroraBackground intensity="strong" jade />
          <div className="container relative z-10 pt-32 md:pt-48 pb-16 md:pb-28 flex flex-col items-center text-center">
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

        {/* Mission & Vision */}
        <section className="py-16 md:py-24 bg-muted/40 relative overflow-hidden">
          <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-24 bottom-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="container relative">
            <Reveal className="text-center">
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
                Who we are
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
                Mission &amp; Vision
              </h2>
              <OrnamentDivider className="mt-5" />
            </Reveal>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {missionVision.map((item, index) => (
                <Reveal key={item.title} delay={index * 120}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-8 shadow-soft backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-1.5 hover:shadow-lift">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-gold/15 ring-1 ring-border/60 transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-3">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-display mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <NewsSection />

        {/* Why Join */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="pointer-events-none absolute -left-32 top-16 h-96 w-96 rounded-full bg-primary/[0.06] blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-gold/[0.07] blur-3xl" aria-hidden="true" />
          <div className="container relative">
            <Reveal className="text-center">
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
                Your community awaits
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
                Why Join LUMS?
              </h2>
              <OrnamentDivider className="mt-5" />
            </Reveal>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Reveal key={feature.title} delay={index * 120}>
                  <Card className="hover-card card-hover-effect group h-full rounded-2xl border-border/70 bg-card/70 shadow-soft backdrop-blur-sm">
                    <CardHeader>
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-gold/15 ring-1 ring-border/60 transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-3">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="font-display group-hover:translate-x-1 transition-transform duration-300">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
