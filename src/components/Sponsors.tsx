import { ArrowRight, Handshake } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider } from "@/components/IslamicPattern";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { SPONSORS, SPONSOR_ROLES } from "@/config/sponsors";

const SponsorLogo = ({
  name,
  url,
  logo,
  logoHeight,
}: {
  name: string;
  url?: string;
  logo?: string;
  /** Height class for this tier's logo (larger tier = more prominent). */
  logoHeight: string;
}) => {
  const content = logo ? (
    <img
      src={logo}
      alt={name}
      className={`${logoHeight} w-auto opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0`}
      loading="lazy"
    />
  ) : (
    <span className="font-display text-2xl tracking-tight text-muted-foreground transition-colors duration-300 hover:text-foreground">
      {name}
    </span>
  );

  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="transition-transform duration-300 ease-organic hover:-translate-y-0.5"
    >
      {content}
    </a>
  ) : (
    <span>{content}</span>
  );
};

export const Sponsors = () => {
  if (SPONSORS.length === 0) return null;

  // Group sponsors by relationship role, in role order, keeping only roles
  // that are shown on the landing page and have at least one sponsor.
  const tiers = SPONSOR_ROLES.filter((role) => role.onLanding)
    .map((role) => ({
      role,
      sponsors: SPONSORS.filter((s) => s.roles.includes(role.id)),
    }))
    .filter((group) => group.sponsors.length > 0);

  return (
    <section className="relative overflow-hidden bg-muted/40 py-16 md:py-16">
      <div className="container relative">
        <Reveal className="text-center">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
            Backed by
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
            Our sponsors &amp; partners
          </h2>
          <OrnamentDivider className="mt-5" />
        </Reveal>

        <div className="mx-auto mt-12 max-w-4xl space-y-12">
          {tiers.map(({ role, sponsors }, groupIndex) => (
            <Reveal key={role.id} delay={groupIndex * 80}>
              <div className="text-center">
                <h3 className="font-display text-lg tracking-tight">
                  {role.pluralLabel}
                </h3>
                <p className="mt-2 mb-3 text-sm text-muted-foreground">
                  {role.shortDescription}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
                  {sponsors.map((sponsor) => (
                    <SponsorLogo
                      key={sponsor.name}
                      name={sponsor.name}
                      url={sponsor.url}
                      logo={sponsor.logo}
                      logoHeight={role.logoHeight}
                    />
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mx-auto mt-14 max-w-xl text-center">
            <div className="flex items-center justify-center gap-2 text-gold">
              <Handshake className="h-5 w-5" />
            </div>
            <p className="mt-3 mb-3 font-display text-xl tracking-tight">
              Interested in collaborating or becoming a sponsor?
            </p>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-full px-8 border-border/80 bg-card/60 backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-0.5 hover:bg-card hover:shadow-soft active:scale-[0.98]"
            >
              <Link to="/collaborate">
                Start here
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
