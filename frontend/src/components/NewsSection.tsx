import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/ui/nav-link";
import { ArrowRight } from "lucide-react";

export const NewsSection = () => {
  const news = [
    {
      date: "March 15, 2024",
      title: "Ramadan Program Announced",
      description: "Join us for daily iftars and special Ramadan activities throughout the holy month. Special lectures and community events planned.",
      link: "/events"
    },
    {
      date: "March 10, 2024",
      title: "New Prayer Room Opening",
      description: "We're excited to announce the opening of a new prayer facility at the Engineering Faculty.",
      link: "/blog"
    },
    {
      date: "March 5, 2024",
      title: "Islamic Awareness Week",
      description: "Mark your calendars for our biggest event of the spring semester. A week full of activities and learning.",
      link: "/events"
    }
  ];

  return (
    <section className="py-8 md:py-16 bg-muted/50">
      <div className="container">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-[#004aac] mb-8 md:mb-12">
          Latest Updates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {news.map((item, index) => (
            <div 
              key={item.title}
              className="bg-background rounded-lg shadow-sm p-4 md:p-6 hover:shadow-md transition-all hover:translate-y-[-5px] group"
              style={{
                animationDelay: `${index * 150}ms`,
                opacity: 0,
                animation: 'fadeUp 0.5s ease-out forwards'
              }}
            >
              <span className="text-sm text-muted-foreground">{item.date}</span>
              <h3 className="text-xl font-semibold mt-2 mb-3 text-[#004aac]">{item.title}</h3>
              <p className="text-muted-foreground mb-4">{item.description}</p>
              <Button 
                asChild 
                variant="ghost" 
                className="p-0 h-7 text-[#004aac] hover:text-[#004aac] hover:underline font-medium hover:bg-transparent"
              >
                <NavLink to={item.link} className="flex items-center">
                  Read more 
                  <ArrowRight className="ml-2 h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                </NavLink>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}; 