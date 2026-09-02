
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuroraBackground } from "@/components/AuroraBackground";
import { FAQ } from "@/components/FAQ";
import { Testimonials } from "@/components/Testimonials";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider } from "@/components/IslamicPattern";
import { Ticket, BadgePercent, HandHeart, Vote } from "lucide-react";
import { useMembershipStatus } from "@/hooks/useMembershipStatus";
import MembershipHero from "@/components/membership/MembershipHero";
import MembershipPlan from "@/components/membership/MembershipPlan";
import BenefitCard from "@/components/BenefitCard";
import WhereYourFeeGoes from "@/components/membership/WhereYourFeeGoes";

const Membership = () => {
  const { status, loading } = useMembershipStatus();

  const benefits = [
    {
      title: "Member-only events",
      description: "Events closed to the public, reserved for our members.",
      Icon: Ticket,
    },
    {
      title: "Reduced event prices",
      description: "ALWAYS discounted prices for members on all events.",
      Icon: BadgePercent,
    },
    {
      title: "Volunteer & shape LUMS",
      description: "Help run events, media and outreach.",
      Icon: HandHeart,
    },
    {
      title: "Vote at the annual meeting",
      description: "Have a say in the association — vote and suggest motions.",
      Icon: Vote,
    },
  ];

  return (
    <div className="min-h-dvh flex flex-col page">
      <Navbar overlay />
      <main className="flex-1">
        {/* ── Header ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden grain">
          <AuroraBackground />
          <div className="container relative z-10 pt-28 md:pt-36 pb-10 md:pb-14">
            <MembershipHero status={status} loading={loading} />
          </div>
        </section>

        {/* ── Why become a member ────────────────────────────────── */}
        <section className="relative py-16 md:py-24">
          <div className="container relative z-10">
            <Reveal className="text-center">
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
                Why become a member
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
                What membership gives you
              </h2>
              <OrnamentDivider className="mt-5" />
            </Reveal>

            <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>
        </section>

        {/* ── Where your fee goes ────────────────────────────────── */}
        <WhereYourFeeGoes />

        {/* ── Plans & pricing ────────────────────────────────────── */}
        <section className="relative py-16 md:py-24">
          <div className="container relative z-10">
            <Reveal className="text-center">
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
                Plans & pricing
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
                Membership plans
              </h2>
              <OrnamentDivider className="mt-5" />
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-8 max-w-2xl text-center text-lg text-muted-foreground text-balance">
                Choose the plan that fits your year — or renew with a single
                term when a new semester starts.
              </p>
            </Reveal>

            <div className="mx-auto mt-12 max-w-3xl">
              <MembershipPlan status={status} loading={loading} />
            </div>
          </div>
        </section>

        <FAQ />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Membership;
