import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/ui/nav-link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider } from "@/components/IslamicPattern";

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
    <section className="py-16 md:py-24">
      <div className="container">
        <Reveal className="text-center">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
            Stay in the loop
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
            Latest Updates
          </h2>
          <OrnamentDivider className="mt-5" />
        </Reveal>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {news.map((item, index) => (
            <Reveal key={item.title} delay={index * 120}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-6 md:p-7 shadow-soft backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-1.5 hover:shadow-lift">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="inline-flex items-center rounded-full bg-muted/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {item.date}
                </span>
                <h3 className="mt-4 text-xl font-display">{item.title}</h3>
                <p className="mt-2.5 text-muted-foreground leading-relaxed">{item.description}</p>
                <Button
                  asChild
                  variant="ghost"
                  className="mt-5 p-0 h-auto text-primary hover:text-primary/80 hover:bg-transparent font-medium"
                >
                  <NavLink to={item.link} className="flex items-center gap-1.5">
                    Read more
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-organic group-hover:translate-x-1" />
                  </NavLink>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}; 