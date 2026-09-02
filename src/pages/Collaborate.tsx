import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Reveal } from "@/components/Reveal";
import { StatCounter } from "@/components/StatCounter";
import {
  OrnamentDivider,
  PatternBackground,
  StarMark,
} from "@/components/IslamicPattern";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Globe, Mail, Sparkles } from "lucide-react";
import { FaInstagram } from "react-icons/fa6";
import {
  COLLABORATION_EMAIL,
  COLLABORATION_SUBJECT,
  PARTNER_HIGHLIGHTS,
  SOCIALS,
  SPONSOR_ROLES,
} from "@/config/sponsors";

/** Build a prefilled mailto link for a given subject line. */
const mailto = (subject: string = COLLABORATION_SUBJECT) =>
  `mailto:${COLLABORATION_EMAIL}?subject=${encodeURIComponent(subject)}`;

const Collaborate = () => {
  return (
    <div className="min-h-dvh flex flex-col page">
      <Navbar overlay />
      <main className="flex-1 relative">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <AuroraBackground />
          <div className="container relative z-10 pt-28 md:pt-36 pb-16 md:pb-24 flex flex-col items-center text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-1.5 text-sm text-muted-foreground shadow-soft backdrop-blur-sm">
                <StarMark className="h-3.5 w-3.5 text-gold" />
                Partner with us
              </span>
            </Reveal>
            <Reveal delay={120}>
              <h1 className="mt-6 font-display text-4xl md:text-6xl tracking-tight text-balance">
                Grow with our <em className="italic text-gold">community</em>
              </h1>
            </Reveal>
            <Reveal delay={220}>
              <p className="mt-5 max-w-2xl text-lg md:text-xl text-muted-foreground text-balance">
                LUMS connects you directly with young Muslims, not just at Lund
                University, but in our entire social circuit — through events, resources,
                big social media presence and a community that values the people who support it.
              </p>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-9 flex flex-wrap gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full px-8 shadow-glow transition-all duration-300 ease-organic hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
                >
                  <a href={mailto()}>
                    <Mail className="h-4 w-4" />
                    Start the conversation
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-full px-8 border-border/80 bg-card/60 backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-0.5 hover:bg-card hover:shadow-soft active:scale-[0.98]"
                >
                  <a href="#ways-to-work">
                    Ways to work with us
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Reach / social proof ─────────────────────────────────── */}
        <section className="relative py-14 md:py-20">
          <div className="container">
            <Reveal className="text-center">
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
                Our reach
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
                Beyond the classroom, into the community
              </h2>
              <OrnamentDivider className="mt-5" />
              <p className="mx-auto mt-6 max-w-2xl text-muted-foreground leading-relaxed">
                Our social media is where our community lives — and it reaches
                far beyond campus, into a network of alumni, mosques,
                organisations and the younger Muslim generation across Sweden, and abroad.
              </p>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Reveal>
                <a
                  href={SOCIALS.instagram.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative flex h-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-8 text-center shadow-soft backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-1.5 hover:shadow-lift"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-3">
                    <FaInstagram className="h-6 w-6" />
                  </div>
                  <div className="font-display text-5xl tracking-tight text-gold">
                    <StatCounter value={SOCIALS.instagram.followers} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Instagram followers
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {SOCIALS.instagram.handle}
                  </p>
                </a>
              </Reveal>

              <Reveal delay={90}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-8 shadow-soft backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-1.5 hover:shadow-lift">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-gold/15 ring-1 ring-border/60 transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-3">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-display">Beyond students</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed text-sm">
                    A network of alumni, mosques, organisations, and families
                    across Lund and Skåne, as well as exchange students from abroad.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={180}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-8 shadow-soft backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-1.5 hover:shadow-lift">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-gold/15 ring-1 ring-border/60 transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-3">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-display">Young &amp; engaged</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed text-sm">
                    A strong presence among the younger Muslim generation who
                    actively support the brands that support them.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Why partner ──────────────────────────────────────────── */}
        <section className="relative py-14 md:py-20">
          <div className="container">
            <Reveal className="text-center">
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
                Why partner
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
                A community worth reaching
              </h2>
              <OrnamentDivider className="mt-5" />
            </Reveal>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {PARTNER_HIGHLIGHTS.map((item, index) => (
                <Reveal key={item.title} delay={index * 90}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-7 shadow-soft backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-1.5 hover:shadow-lift">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-gold/15 ring-1 ring-border/60 transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-3">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-display">{item.title}</h3>
                    <p className="mt-2 text-muted-foreground leading-relaxed text-sm">
                      {item.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Ways to work with us ─────────────────────────────────── */}
        <section
          id="ways-to-work"
          className="relative py-14 md:py-20 bg-muted/40"
        >
          <div className="container">
            <Reveal className="text-center">
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
                Ways to work with us
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
                Choose how you'd like to get involved
              </h2>
              <OrnamentDivider className="mt-5" />
            </Reveal>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
              {SPONSOR_ROLES.map((role, index) => (
                <Reveal key={role.id} delay={index * 100}>
                  <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-8 shadow-soft backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-1.5 hover:shadow-lift">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-gold/15 ring-1 ring-border/60 transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-3">
                      <role.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-display">{role.label}</h3>
                    <p className="mt-1 text-sm font-medium text-gold">
                      {role.tagline}
                    </p>
                    <p className="mt-3 text-muted-foreground leading-relaxed">
                      {role.description}
                    </p>

                    <ul className="mt-5 space-y-2.5">
                      {role.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="flex items-start gap-2.5 text-sm text-muted-foreground"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 pt-5 border-t border-border/60 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        How you'll appear:
                      </span>{" "}
                      {role.recognition}
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      className="mt-5 h-11 rounded-full"
                    >
                      <a href={mailto(`${role.label} — LUMS`)}>
                        <Mail className="h-4 w-4" />
                        {role.cta}
                      </a>
                    </Button>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section className="relative pb-16 md:pb-24">
          <div className="container">
            <Reveal>
              <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary to-[hsl(222,80%,26%)] px-6 py-16 md:py-20 text-center text-primary-foreground shadow-lift grain">
                <div
                  className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-gold/25 blur-3xl"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-gold/20 blur-3xl"
                  aria-hidden="true"
                />
                <PatternBackground tintClassName="bg-white opacity-[0.24]" />
                <div className="relative z-10">
                  <OrnamentDivider
                    className="mb-7 text-white"
                    lineClassName="opacity-40"
                    starClassName="text-gold"
                  />
                  <h2 className="mx-auto max-w-2xl text-3xl md:text-5xl font-display tracking-tight text-balance">
                    Let's build something together
                  </h2>
                  <p className="mx-auto mt-5 max-w-2xl text-lg opacity-90 text-balance">
                    Tell us what you have in mind and we'll get back to you
                    within a few days.
                  </p>
                  <div className="mt-9 flex flex-col items-center gap-3">
                    <Button
                      asChild
                      size="lg"
                      className="h-12 rounded-full bg-white px-8 text-[hsl(215,88%,34%)] hover:bg-white/90 shadow-lift transition-all duration-300 ease-organic hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                      <a href={mailto()}>
                        <Mail className="h-4 w-4" />
                        {COLLABORATION_EMAIL}
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Collaborate;
