import { Reveal } from "@/components/Reveal";
import { OrnamentDivider } from "@/components/IslamicPattern";
import {
  UtensilsCrossed,
  Shirt,
  Landmark,
  Ban
} from "lucide-react";

/**
 * Transparency section: what the membership fee actually funds.
 * Draft copy — verify each claim with the board before launch.
 */
const items = [
  {
    title: "Events & activities",
    description: "Halal food, venues, banquets/sittningar, lectures and socials.",
    Icon: UtensilsCrossed,
  },
  {
    title: "Merch",
    description: "Branded & non-branded merchandise for members.",
    Icon: Shirt,
  },
  {
    title: "Running the association",
    description: "Administration, bank fees, materials for events and the tools that keep a non-profit going.",
    Icon: Landmark,
  },
  {
    title: "Zero board member benefits",
    description: "The association is run entirely by volunteer workers, the board receives no money. \
    We pay the membership fee as well!",
    Icon: Ban,
  },
];

const WhereYourFeeGoes = () => (
  <section className="relative overflow-hidden bg-muted/40 py-16 md:py-24">
    <div
      className="pointer-events-none absolute -left-24 bottom-10 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
      aria-hidden="true"
    />
    <div
      className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
      aria-hidden="true"
    />
    <div className="container relative z-10">
      <Reveal className="text-center">
        <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
          Where your fee goes
        </span>
        <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
          Your fee, at work
        </h2>
        <OrnamentDivider className="mt-5" />
      </Reveal>

      <p className="mx-auto mt-8 max-w-2xl text-center text-lg text-muted-foreground text-balance">
        LUMS is a registered non-profit — every krona goes back into the
        association and its community.
      </p>

      <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        {items.map((item, index) => (
          <Reveal key={item.title} delay={index * 70} className="h-full">
            <div className="flex h-full flex-col items-center rounded-2xl border border-border/70 bg-card/60 p-5 text-center shadow-soft backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-1 hover:shadow-lift">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold">
                <item.Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

export default WhereYourFeeGoes;
