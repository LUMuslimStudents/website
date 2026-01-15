import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowRight, Calendar, Users, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { CTASection } from "@/components/CTASection";
import { NewsSection } from "@/components/NewsSection";

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

  const missionVision = [
    {
      title: "Our Mission",
      description: "To create a supportive and inclusive environment for Muslim students at Lund University, fostering spiritual growth, academic excellence, and community engagement.",
      icon: "🎯"
    },
    {
      title: "Our Vision",
      description: "To be a leading Muslim student organization that empowers members to thrive in their academic journey while maintaining their Islamic identity and contributing positively to society.",
      icon: "👁️"
    },
    {
      title: "Our Values",
      description: "Unity in diversity, academic excellence, spiritual development, community service, and mutual respect.",
      icon: "⭐"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col page">
      <Navbar />
      <main className="flex-1">
        <div className="container py-12 md:py-24 flex flex-col items-center gradient-bg">
          <div className="relative">
            <img 
              src="/logos/LUMS - Banner Logo_Transparent.png"
              alt="LUMS Logo" 
              className="w-96 md:w-96 mb-8 animate-in fade-in duration-1000 relative z-10"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/10 -z-0" />
          </div>
          
          <div className="text-center max-w-3xl mx-auto">
            {/* <h1 className="text-4xl md:text-6xl font-bold mb-6 text-[#004aac] tracking-tight animate-in slide-in-from-bottom duration-700">
              Welcome to LUMS
            </h1> */}
            <p className="text-xl text-muted-foreground mb-8 animate-in slide-in-from-bottom duration-700 delay-200">
              Lund University Muslim Students - A community dedicated to supporting Muslim students at Lund University
            </p>
            <div className="flex gap-4 justify-center animate-in slide-in-from-bottom duration-700 delay-300">
              <Button 
                asChild 
                size="lg"
                className="bg-[#004aac] hover:bg-[#004aac]/90 transition-all duration-300"
              >
                <Link to="/membership">Join Us</Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="border-[#004aac] text-[#004aac] hover:bg-[#004aac]/10 transition-all duration-300"
              >
                <Link to="/events">Our Events</Link>
              </Button>
            </div>
          </div>
        </div>

        <section className="py-16 bg-muted">
          <div className="container">
            <h2 className="text-3xl font-bold text-center text-[#004aac] mb-12">
              Mission & Vision
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {missionVision.map((item, index) => (
                <div 
                  key={item.title}
                  className="bg-background p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                  style={{
                    animationDelay: `${index * 150}ms`,
                    opacity: 0,
                    animation: 'animate-in 0.5s ease-out forwards'
                  }}
                >
                  <div className="text-4xl mb-4 text-center">{item.icon}</div>
                  <h3 className="text-xl font-semibold mb-3 text-[#004aac] text-center">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-center">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <NewsSection />

        <section className="px-4 py-16 mx-auto container">
          <div className="text-center mb-16 relative">
            <h2 className="text-3xl font-bold text-[#004aac] tracking-tight">
              Why Join LUMS?
            </h2>
            <span className="absolute left-1/2 transform -translate-x-1/2 w-20 h-0.5 bg-[#004aac]/20 mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="hover-card card-hover-effect group"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  opacity: 0,
                  animation: 'animate-in 0.5s ease-out forwards'
                }}
              >
                <CardHeader>
                  <feature.icon className="h-8 w-8 mb-2 text-[#004aac] feature-icon" />
                  <CardTitle className="text-[#004aac] group-hover:translate-x-1 transition-transform duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
