
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Check } from "lucide-react";

const Membership = () => {
  const plans = [
    {
      id: 1,
      name: "Student Membership",
      price: "100 SEK",
      period: "per semester",
      features: [
        "Access to all LUMS events",
        "Prayer room access",
        "Community WhatsApp group",
        "Weekly newsletters",
        "Event discounts",
      ],
    },
    {
      id: 2,
      name: "Supporting Member",
      price: "200 SEK",
      period: "per semester",
      features: [
        "All Student Member benefits",
        "Support LUMS activities",
        "Recognition in our community",
        "Special event invitations",
        "Mentorship opportunities",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="text-center mb-12 animate-in">
          <h1 className="text-4xl font-bold mb-4">Join LUMS</h1>
          <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
            Become part of our vibrant Muslim student community in Lund and enjoy exclusive benefits.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1000px] mx-auto">
          {plans.map((plan) => (
            <Card key={plan.id} className="hover-card">
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
              <CardFooter>
                <Button className="w-full">Become a Member</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Membership;
