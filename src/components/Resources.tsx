import { Link } from "react-router-dom";
import { ArrowRight, Mosque, Compass, Map as MapIcon } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider } from "@/components/IslamicPattern";

const resources = [
  {
    title: "Prayer times",
    description: "Daily prayer times for Lund, updated for the term.",
    Icon: Mosque,
    to: "/resources/prayer-times",
  },
  {
    title: "Prayer rooms & qibla",
    description: "Find prayer rooms on campus and the direction of the qibla.",
    Icon: Compass,
    to: "/resources/prayer-rooms",
  },
  {
    title: "Halal map",
    description: "Halal-friendly restaurants and shops in Lund.",
    Icon: MapIcon,
    to: "/resources/halal-map",
  },
];

export const Resources = () => (
  <section className="relative overflow-hidden bg-muted/40 py-16 md:py-24">
    <div
      className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
      aria-hidden="true"
    />
    <div
      className="pointer-events-none absolute -left-24 bottom-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
      aria-hidden="true"
    />
    <div className="container relative">
      <Reveal className="text-center">
        <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
          Everyday tools
        </span>
        <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
          Practical resources
        </h2>
        <OrnamentDivider className="mt-5" />
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
        {resources.map((resource, index) => (
          <Reveal key={resource.title} delay={index * 100} className="h-full">
            <Link
              to={resource.to}
              className="group relative flex h-full flex-col items-center rounded-2xl border border-border/70 bg-card/60 p-6 text-center shadow-soft backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-3">
                <resource.Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg tracking-tight">
                {resource.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {resource.description}
              </p>
              <span className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-medium text-primary">
                Open
                <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-organic group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
