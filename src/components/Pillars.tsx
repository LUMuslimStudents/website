import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider } from "@/components/IslamicPattern";

const pillars = [
  {
    title: "Community",
    description:
      "Brothers and sisters brought together by faith — friendships and bonds for life.",
    image: "/assets/community.jpg",
    to: "/about",
  },
  {
    title: "Events",
    description:
      "From lectures and sittningar to sports and trips — halal by design.",
    image: "/assets/welcome_to_lums_event.png",
    to: "/about",
  },
  {
    title: "Representation",
    description:
      "Uncompromising on our faith — actively combating Islamophobia on campus.",
    image: "/assets/islamophobia.png",
    to: "/about",
  },
];

export const Pillars = () => (
  <section className="relative overflow-hidden py-16 md:py-24">
    <div
      className="pointer-events-none absolute -left-32 top-16 h-96 w-96 rounded-full bg-primary/[0.06] blur-3xl"
      aria-hidden="true"
    />
    <div className="container relative">
      <Reveal className="text-center">
        <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
          A short overview
        </span>
        <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
          What we do
        </h2>
        <OrnamentDivider className="mt-5" />
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {pillars.map((pillar, index) => (
          <Reveal key={pillar.title} delay={index * 100} className="h-full">
            <Link
              to={pillar.to}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/70 shadow-soft backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-1.5 hover:shadow-lift"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={pillar.image}
                  alt={pillar.title}
                  className="h-full w-full object-cover transition-transform duration-500 ease-organic group-hover:scale-[1.04]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <h3 className="absolute bottom-4 left-5 font-display text-2xl tracking-tight text-white drop-shadow-sm">
                  {pillar.title}
                </h3>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
                <span className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-medium text-primary">
                  Learn more
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-organic group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
