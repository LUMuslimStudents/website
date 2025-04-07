
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface MembershipPlanProps {
  onBecomeMember: () => void;
}

const MembershipPlan = ({ onBecomeMember }: MembershipPlanProps) => {
  const plan = {
    name: "Student Membership",
    price: "100 SEK",
    period: "per semester",
    features: [
      "Access to all LUMS events",
      "Community WhatsApp group",
      "Weekly newsletters",
      "Event discounts",
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <div className="flex items-baseline mt-4">
          <span className="text-3xl font-bold">{plan.price}</span>
          <span className="ml-2 text-muted-foreground">{plan.period}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center">
              <Check className="h-4 w-4 text-primary mr-2" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pb-4">
        <Button 
          variant="default"
          className="w-full bg-[#004aac] hover:bg-[#004aac]/90 text-white font-medium py-2"
          onClick={onBecomeMember}
        >
          Become a Member
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MembershipPlan;
