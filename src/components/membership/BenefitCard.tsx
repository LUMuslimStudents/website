
import { LucideIcon } from "lucide-react";

interface BenefitCardProps {
  title: string;
  description: string;
  Icon: LucideIcon;
}

const BenefitCard = ({ title, description, Icon }: BenefitCardProps) => {
  return (
    <div className="group p-6 rounded-lg border bg-card hover:shadow-lg transition-all duration-300">
      <Icon className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default BenefitCard;
