import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Ticket, BadgePercent, Vote, HandHeart } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider } from "@/components/IslamicPattern";
import BenefitCard from "@/components/BenefitCard";

const benefits = [
  {
    title: "Member-only events",
    description: "Events closed to the public, reserved for our members.",
    Icon: Ticket,
  },
  {
    title: "Reduced event prices",
    description: "Always discounted prices for members on all events.",
    Icon: BadgePercent,
  },
  {
    title: "Vote at the annual meeting",
    description: "Have a say in the association — vote and suggest motions.",
    Icon: Vote,
  },
  {
    title: "Volunteer & shape LUMS",
    description: "Help run events, media and outreach.",
    Icon: HandHeart,
  },
];

export const WhyJoin = () => (
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
          Membership
        </span>
        <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
          Why become a member
        </h2>
        <OrnamentDivider className="mt-5" />
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit, index) => (
          <BenefitCard
            key={benefit.title}
            title={benefit.title}
            description={benefit.description}
            Icon={benefit.Icon}
            delay={index * 80}
          />
        ))}
      </div>

      <Reveal delay={120} className="mt-12 text-center">
        <Button
          asChild
          size="lg"
          className="h-12 rounded-full px-8 shadow-glow transition-all duration-300 ease-organic hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
        >
          <Link to="/membership">
            Become a member
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </Reveal>
    </div>
  </section>
);
