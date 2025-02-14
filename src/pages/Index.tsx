
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { ArrowRight, Calendar, Users, Star } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      title: "Exclusive Events",
      description: "Access to members-only events and activities",
      icon: Calendar,
    },
    {
      title: "Community",
      description: "Connect with fellow students and alumni",
      icon: Users,
    },
    {
      title: "Benefits",
      description: "Special discounts and opportunities",
      icon: Star,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="px-4 py-20 md:py-32 mx-auto container text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in">
            Welcome to StudentAssoc
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-[600px] mx-auto animate-in">
            Join our vibrant community of students and unlock exclusive benefits,
            events, and opportunities.
          </p>
          <div className="flex gap-4 justify-center animate-in">
            <Link to="/membership">
              <Button size="lg" className="group">
                Join Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/events">
              <Button size="lg" variant="outline">
                Explore Events
              </Button>
            </Link>
          </div>
        </section>

        <section className="px-4 py-16 mx-auto container">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Join StudentAssoc?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover-card">
                <CardHeader>
                  <feature.icon className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
