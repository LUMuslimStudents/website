import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Reveal } from "@/components/Reveal";
import { StatCounter } from "@/components/StatCounter";
import {
  OrnamentDivider,
  KhatamPattern,
  StarMark 
} from "@/components/IslamicPattern";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ArrowRight
} from "lucide-react";

const About = () => {
  // Draft pillar outline — titles are suggestions, blurbs are placeholders.
  const pillars = [
    {
      title: "Community",
      description:
        "Through LUMS, brothers and sisters create friendships and bonds for life, brought together \
        by what's most important - our faith.",
      image: "/assets/community.jpg"
    },
    {
      title: "Events",
      description:
        "From Nollning activities, to gatherings, to sports, to lectures, we try to have a balance \
        of fun activities as well as Islamic events, all tailored for a diverse community. \
        We also do events that curate for brothers and sisters separately if you find that more comfortable!",
      image: "/assets/welcome_to_lums_event.png",
    },
    {
        title: "Representation",
        description:
        "Our Muslim Indentity comes first, but it is no secret that we live in political unrest in Europe \
        as Muslims. LUMS, therefore, actively works on demostrating that we are uncompromising and \
        unapologetic when it comes to our faith, and combating Islamophobia.",
        image: "/assets/islamophobia.png",
    },
    {
      title: "Donation Campaigns",
      description:
        "In the trying times we live in today, we try to help our brothers and sisters in need around the world. \
        We often hold campaigns to support them with what we can. May Allah protect and save them.",
      image: "/assets/campaign.jpg",
    },
  ];

  // Founding-story milestones — years and text are placeholders to fill in.
  const milestones = [
    { year: "2022", text: "Prayer room for LTH -> Praying group is started." },
    { year: "2022 - September", text: "LUMS as an idea is formed. Operations are started and events are held." },
    { year: "2023 - May", text: "LUMS is registered as a non-profit at the authorities." },
    { year: "2023 - June", text: "First annual meeting. LUMS is officially established as an org." },
    { year: "2023 - September", text: "First Halal Nollning program in Sweden." },
    { year: "Today", text: "One of the biggest MSAs in Sweden." },
  ];

  // Key figures — update the values as they grow.
  const stats = [
    { value: 308, label: "Members so far" },
    { value: 50, label: "Events hosted so far" },
    { value: 4, label: "Years active" },
  ];

  return (
    <div className="min-h-dvh flex flex-col page">
      <Navbar overlay />
      <main className="flex-1 relative">
        <AuroraBackground />
        <div className="container relative z-10 pt-28 md:pt-36 pb-14 md:pb-20">
          {/* ── Header ─────────────────────────────────────────────── */}
          <Reveal className="text-center">
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
              About us
            </span>
            <h1 className="mt-3 text-4xl md:text-5xl font-display tracking-tight">
              About
            <img className="inline w-[4em] align-text-top" src="/logos/Logo - Typeface.png" />
            </h1>
            <OrnamentDivider className="mt-5" />
          </Reveal>

          {/* ── Who we are ─────────────────────────────────────────── */}
          <section className="mt-16 md:mt-24">
            <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
              <Reveal>
                <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
                  Who we are
                </span>
                <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight text-balance">
                  Our association
                </h2>
                <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                  We are an official, registered, independent, non-profit student association,
                  bringing together Muslim Students at Lund University since 2023.
                </p>
                <p className="mt-4 mb-4 text-muted-foreground leading-relaxed">
                  LUMS was created to provide a Halal environment for all students in Lund.
                  Our main goal is to bring young Muslims together, and provide a way to experience
                  the student life in Lund by setting the <strong>Muslim Identity</strong> at
                  the very center without compromise, in a way that satisfies Allah SWT.
                </p>
                 <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full px-8 shadow-glow transition-all duration-300 ease-organic hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
                >
                  <Link to="/by-laws">
                    How LUMS is governed
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </Reveal>

              <Reveal delay={120}>
                <figure className="relative">
                  <img
                    src="/assets/lums_sittning.jpg"
                    alt="LUMS members gathered at a sittning"
                    className="w-full h-auto rounded-[1.5rem] border border-border/70 shadow-soft"
                    loading="lazy"
                  />
                </figure>
              </Reveal>
            </div>
          </section>

          {/* ── What we do ─────────────────────────────────────────── */}
          <section className="mt-20 md:mt-28">
            <Reveal className="text-center">
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
                A short overview of our operation
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
                What we do
              </h2>
              <OrnamentDivider className="mt-5" />
            </Reveal>

            <div className="mx-auto mt-12 max-w-5xl divide-y divide-border/70 border-y border-border/70">
              {pillars.map((pillar, index) => (
                <Reveal key={pillar.title} delay={index * 80}>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 md:gap-12 items-center py-8 md:py-10">
                    <div>
                      <h3 className="text-xl md:text-2xl font-display tracking-tight">
                        {pillar.title}
                      </h3>
                      <p className="mt-3 max-w-xl text-muted-foreground leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                    <img
                      src={pillar.image}
                      alt={pillar.title}
                      className="w-full md:h-72 md:w-96 rounded-xl object-cover border border-border/70 shadow-soft"
                      loading="lazy"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ── Our story ──────────────────────────────────────────── */}
          <section className="mt-20 md:mt-28">
            <Reveal className="text-center">
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
                From prayer room to big community
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
                Our Story
              </h2>
              <OrnamentDivider className="mt-5" />
            </Reveal>

            <div className="mx-auto mt-12 max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
              {/* Archival photo */}
              <Reveal className="md:order-2">
                <figure className="relative">
                  <img
                    src="/assets/lu-library.jpg"
                    alt="LUMS members gathered at a sittning"
                    className="w-full h-auto rounded-[1.5rem] border border-border/70 shadow-soft"
                    loading="lazy"
                  />
                </figure>
              </Reveal>

              {/* Founding story text */}
              <Reveal delay={120} className="md:order-1">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  LUMS humble beginnings started with a group of students trying to get a prayer room
                  at the faculty of engineering (LTH) in LU back in 2022. 
                </p>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  These siblings, may Allah reward them with great Ajr,
                  realized that there is a great lack of a sense of community among the Muslim students
                  at LU when they were trying to gather signatures for the prayer room.
                </p>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Since then, each year we've held Halal Nollning programs, held lectures, hosted banquets,
                  collaborated with many other organizations and mosques, and supported many students.
                  Today, LUMS is one of the biggest Muslim Student associations in Sweden, Alhamdulillah!
                </p>
              </Reveal>
            </div>

            {/* Milestones */}
            <ol className="mx-auto mt-14 max-w-2xl">
              {milestones.map((milestone, index) => (
                <li key={milestone.year} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gold ring-4 ring-background"
                      aria-hidden="true"
                    />
                    {index < milestones.length - 1 && (
                      <span className="w-px flex-1 bg-border/70" aria-hidden="true" />
                    )}
                  </div>
                  <Reveal delay={index * 80} className="pb-8">
                    <span className="text-sm font-semibold uppercase tracking-[0.15em] text-gold">
                      {milestone.year}
                    </span>
                    <p className="mt-1 text-muted-foreground leading-relaxed">
                      {milestone.text}
                    </p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </section>

          {/* ── By the numbers → join ───────────────────────────────── */}
          <section className="mt-20 md:mt-28">
            <Reveal className="text-center">
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
                By the numbers
              </span>
            </Reveal>

            <Reveal className="mt-10">
              <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-border/70 bg-card/70 shadow-soft backdrop-blur-sm">
                <div
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
                  aria-hidden="true"
                />
                <KhatamPattern className="text-foreground/[0.06]" />
                <div className="relative">
                  {/* Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/70">
                    {stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex flex-col items-center gap-2 px-6 py-10 text-center"
                      >
                        <StarMark className="h-4 w-4 text-gold/70" />
                        <StatCounter
                          value={stat.value}
                          className="text-4xl md:text-5xl font-display text-gold"
                        />
                        <span className="text-sm text-muted-foreground">
                          {stat.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border/70 px-6 py-12 md:py-16 text-center">
                    <h2 className="mx-auto max-w-2xl text-3xl md:text-4xl font-display tracking-tight text-balance">
                      What are you waiting for?
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground text-balance">
                      Join them, create memories for life, and become a part of
                      something meaningful.
                    </p>
                    <Button
                      asChild
                      size="lg"
                      className="mx-auto mt-8 h-12 rounded-full px-8 shadow-glow transition-all duration-300 ease-organic hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
                    >
                      <Link to="/membership" className="flex items-center gap-2">
                        Become a Member
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
