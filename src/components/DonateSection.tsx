import { Heart } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider } from "@/components/IslamicPattern";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const DonateSection = () => {
  return (
    <section className="relative overflow-hidden bg-muted/40 py-16 md:py-20">
      <div className="container">
        <Reveal className="text-center">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
            Support LUMS
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
            Help keep our community running
          </h2>
          <OrnamentDivider className="mt-5" />
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground leading-relaxed">
            LUMS is run entirely by volunteers and funded by our community. A
            small donation goes a long way in keeping our events, resources and
            initiatives alive.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-12 rounded-full px-8 shadow-glow transition-all duration-300 ease-organic hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
          >
            <Link to="/donate">
              <Heart className="h-4 w-4" />
              Donate now
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
};
