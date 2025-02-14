
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowRight, Calendar, Users, Star } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      title: "Community",
      description: "Connect with fellow Muslim students in Lund",
      icon: Users,
    },
    {
      title: "Events",
      description: "Join our regular gatherings and special occasions",
      icon: Calendar,
    },
    {
      title: "Support",
      description: "Access resources and support network",
      icon: Star,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="px-4 py-20 md:py-32 mx-auto container text-center">
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/2f0b86ee-d92e-4b14-b2bb-9001b82c5ce2.png" 
              alt="LUMS Logo" 
              className="h-32 w-auto"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in text-primary">
            Welcome to LUMS
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-[600px] mx-auto animate-in">
            Lund University Muslim Students - Building a supportive community for Muslim students
            in Lund through events, activities, and connections.
          </p>
          <div className="flex gap-4 justify-center animate-in">
            <Link to="/membership">
              <Button size="lg" className="group">
                Join LUMS
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/events">
              <Button size="lg" variant="outline">
                Upcoming Events
              </Button>
            </Link>
          </div>
        </section>

        <section className="px-4 py-16 mx-auto container">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">
            Why Join LUMS?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover-card">
                <CardHeader>
                  <feature.icon className="h-8 w-8 mb-2 text-secondary" />
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
      <Footer />
    </div>
  );
};

export default Index;
