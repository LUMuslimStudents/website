import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider } from "@/components/IslamicPattern";
import { Embed } from "@/components/ui/embed";

const HalalMap = () => {
  const MAP_URL = "https://www.google.com/maps/d/embed?mid=187cp8q6tsWYyBlxrtR6zliYM-WXCTtk&ehbc=2E312F";

  return (
    <div className="min-h-dvh flex flex-col page">
      <Navbar overlay />
      <main className="flex-1 relative">
        <AuroraBackground />
        <div className="container relative z-10 pt-28 md:pt-36 pb-14 md:pb-20">
          <Reveal className="text-center">
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
              Every place relevant to Muslims in Lund*
            </span>
            <h1 className="mt-3 text-4xl md:text-5xl font-display tracking-tight">
              Halal Map
            </h1>
            <OrnamentDivider className="mt-5" />
          </Reveal>
          <Reveal>
            <Embed src={MAP_URL} className="mt-8 mb-12" />
            <p className="text-sm text-muted-foreground">
              *We at LUMS do not take any responsibility if the restaurant changes their offering from Halal meat.
              <br/>
              Therefore, we encourage you to still inquire yourself. Jazaka Allah Khair.
            </p>
          </Reveal>
          <Reveal>
            <p className="text-xl font-medium tracking-tight mt-5">
              Help us keep the map up to date. If you notice something,
              &nbsp;
              <a
                className="mt-0.5 inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                href="mailto:muslimskastudenterlu@gmail.com"
              >Send us an email!</a>
            </p>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HalalMap; 