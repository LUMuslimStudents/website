import { useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { BentoGrid, type BentoItem } from "@/components/ui/bento-grid";
import { GradientCTA } from "@/components/ui/call-to-action";
import { Calendar, Users, Star, BookOpen, Heart, Globe } from "lucide-react";

const Index = () => {
  const missionRef = useRef<HTMLDivElement>(null);

  const textVariants = {
    visible: (i: number) => ({
      filter: "blur(0px)",
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.3,
        duration: 0.8,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      opacity: 0,
      y: 20,
    },
  };

  const bentoItems: BentoItem[] = [
    {
      title: "Weekly Jum'ah",
      meta: "Every Friday",
      description: "Join us for weekly congregational prayers on campus with inspiring khutbahs from visiting speakers and student leaders.",
      icon: <Users className="w-5 h-5" />,
      status: "Weekly",
      tags: ["Prayer", "Community"],
      colSpan: 2,
      hasPersistentHover: true,
    },
    {
      title: "Islamic Classes",
      meta: "Tuesdays 18:00",
      description: "Deepen your knowledge with our structured halaqas covering Seerah, Fiqh, and Quranic Tafseer.",
      icon: <BookOpen className="w-5 h-5" />,
      status: "New",
      tags: ["Education", "Knowledge"],
    },
    {
      title: "Ramadan Iftars",
      meta: "Upcoming",
      description: "Experience the joy of breaking fast together during the blessed month with daily community iftars.",
      icon: <Heart className="w-5 h-5" />,
      tags: ["Ramadan", "Food"],
      colSpan: 1,
    },
    {
      title: "Cultural Diversity",
      meta: "50+ Nationalities",
      description: "A melting pot of cultures united by faith. Celebrate the beautiful diversity of our Muslim ummah at Lund.",
      icon: <Globe className="w-5 h-5" />,
      status: "Always",
      tags: ["Culture", "Brotherhood", "Sisterhood"],
      colSpan: 2,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroGeometric />

        {/* --- Mission & Vision Section (Scroll Reveal) --- */}
        <section className="py-32 px-4 md:px-8 bg-background relative" ref={missionRef}>
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background/50 to-transparent pointer-events-none" />
          <div className="max-w-5xl mx-auto flex flex-col justify-center items-center text-center relative z-10">
            <TimelineContent
              as="div"
              animationNum={0}
              timelineRef={missionRef}
              customVariants={textVariants}
              className="text-sm font-bold tracking-widest text-secondary uppercase mb-6"
            >
              Who We Are
            </TimelineContent>

            <TimelineContent
              as="h2"
              animationNum={1}
              timelineRef={missionRef}
              customVariants={textVariants}
              className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-8"
            >
              We are on a mission to{" "}
              <span className="text-primary">empower</span> Muslim students, 
              foster <span className="text-secondary">spiritual growth</span>, 
              and build a united <span className="text-primary">community</span> at Lund University.
            </TimelineContent>

            <TimelineContent
              as="p"
              animationNum={2}
              timelineRef={missionRef}
              customVariants={textVariants}
              className="text-lg md:text-2xl text-foreground/70 max-w-3xl leading-relaxed"
            >
              Our vision is to be a leading organization that helps members thrive academically while maintaining a strong Islamic identity and contributing positively to Swedish society.
            </TimelineContent>
          </div>
        </section>

        {/* --- Latest Updates & Events (Bento Grid) --- */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
                What's Happening
              </h2>
              <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                Stay updated with our latest events, classes, and community gatherings.
              </p>
            </div>
            <BentoGrid items={bentoItems} />
          </div>
        </section>

        {/* --- Why Join Us + Call to Action --- */}
        <GradientCTA />

      </main>
      <Footer />
    </div>
  );
};

export default Index;
