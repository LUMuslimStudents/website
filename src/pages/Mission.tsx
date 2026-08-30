import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider } from "@/components/IslamicPattern";
import { Target, Eye, HeartHandshake } from "lucide-react";

const Mission = () => {
  const missionVision = [
    {
      title: "Our Mission",
      description: "To build a bridge of solidarity and reinforcing the religious thread that binds \
                    Muslim students at Lund University, as well as elevate their identity to new \
                    heights and foster a harmonious community.",
      icon: Target,
    },
    {
      title: "Our Vision",
      description: "To promote, unite, and represent Muslim students at Lund University by creating \
                    an alternative halal environment for social interactions, organizing enriching \
                    activities to empower and educate our students, while actively combating Islamophobia.",
      icon: Eye,
    },
    {
      title: "Our Values",
      description: "faith in Allah SWT, unity in diversity, academic excellence, and mutual respect.",
      icon: HeartHandshake,
    },
  ];

  return (
    <div className="min-h-dvh flex flex-col page">
      <Navbar overlay />
      <main className="flex-1 relative">
        <AuroraBackground />
        <div className="container relative z-10 pt-28 md:pt-36 pb-14 md:pb-20">
          <Reveal className="text-center">
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
              Who we are
            </span>
            <h1 className="mt-3 text-4xl md:text-5xl font-display tracking-tight">
              Mission &amp; Vision
            </h1>
            <OrnamentDivider className="mt-5" />
          </Reveal>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {missionVision.map((item, index) => (
              <Reveal key={item.title} delay={index * 120}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-8 shadow-soft backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-1.5 hover:shadow-lift">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-gold/15 ring-1 ring-border/60 transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-3">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-display mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Mission; 