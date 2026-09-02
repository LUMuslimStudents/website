import { LucideIcon } from "lucide-react";
import { Reveal } from "@/components/Reveal";

interface BenefitCardProps {
  title: string;
  description: string;
  Icon: LucideIcon;
  delay?: number;
}

const BenefitCard = ({ title, description, Icon, delay = 0 }: BenefitCardProps) => {
  return (
    <Reveal delay={delay} className="h-full">
      <div className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-6 shadow-soft backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-1 hover:shadow-lift">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/5 blur-2xl transition-colors duration-300 group-hover:bg-gold/10" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="relative mt-5 font-display text-xl tracking-tight">
          {title}
        </h3>
        <p className="relative mt-2 text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </Reveal>
  );
};

export default BenefitCard;
