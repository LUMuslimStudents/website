import { ArrowRight, Handshake } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider } from "@/components/IslamicPattern";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { SPONSORS, SPONSOR_TIERS, type SponsorTier } from "@/config/sponsors";

const SPONSOR_EMAIL = "muslimskastudenterlu@gmail.com";

const SponsorLogo = ({ name, url, logo }: { name: string; url?: string; logo?: string }) => {
  const content = logo ? (
    <img
      src={logo}
      alt={name}
      className="h-48 w-auto opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
      loading="lazy"
    />
  ) : (
    <span className="font-display text-2xl tracking-tight text-muted-foreground transition-colors duration-300 hover:text-foreground">
      {name}
    </span>
  );

  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className="transition-transform duration-300 ease-organic hover:-translate-y-0.5">
      {content}
    </a>
  ) : (
    <span>{content}</span>
  );
};

export const Sponsors = () => {
  if (SPONSORS.length === 0) return null;

  // Group sponsors by tier, only keeping tiers that have at least one sponsor.
  const tiers = (Object.keys(SPONSOR_TIERS) as SponsorTier[])
    .map((tier) => ({ tier, sponsors: SPONSORS.filter((s) => s.tier === tier) }))
    .filter((group) => group.sponsors.length > 0);

  return (
    <section className="relative overflow-hidden bg-muted/40 py-16 md:py-16">
      <div className="container relative">
        <Reveal className="text-center">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
            Partners
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
            Our sponsors
          </h2>
          <OrnamentDivider className="mt-5" />
        </Reveal>

        <div className="mx-auto mt-12 max-w-4xl space-y-12">
          {tiers.map(({ tier, sponsors }, groupIndex) => (
            <Reveal key={tier} delay={groupIndex * 80}>
              <div className="text-center">
                <h3 className="font-display text-lg tracking-tight">
                  {SPONSOR_TIERS[tier].label}
                </h3>
                <p className="mt-3 mb-3 text-sm text-muted-foreground">
                  {SPONSOR_TIERS[tier].description}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
                  {sponsors.map((sponsor) => (
                    <SponsorLogo
                      key={sponsor.name}
                      name={sponsor.name}
                      url={sponsor.url}
                      logo={sponsor.logo}
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
                <ArrowRight  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
