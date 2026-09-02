import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider } from "@/components/IslamicPattern";
import { Embed } from "@/components/ui/embed";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
} from "lucide-react";

const AdhanSchedule = () => {
  const MY_MASJID_URL = "https://time.my-masjid.com/timingscreen/1297a0cf-3faa-4120-953a-8d545c75ed79";
  const FULL_YEAR_CALENDAR_URL = "https://time.my-masjid.com/sharescreen/1297a0cf-3faa-4120-953a-8d545c75ed79";

  return (
    <div className="min-h-dvh flex flex-col page">
      <Navbar overlay />
      <main className="flex-1 relative">
        <AuroraBackground />
        <div className="container relative z-10 pt-28 md:pt-36 pb-14 md:pb-20">
          <Reveal className="text-center">
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
              Adhan &amp; Iqamah*
            </span>
            <h1 className="mt-3 text-4xl md:text-5xl font-display tracking-tight">
              Prayer Times
            </h1>
            <OrnamentDivider className="mt-5" />
          </Reveal>
          <Reveal>
            <Embed src={MY_MASJID_URL} className="mt-8 mb-8" />
            <p className="text-sm text-muted-foreground">
              *Iqamah times are shown for Lund Mosque (IKC).
              Adhan times are the same for all mosques in Lund.
            </p>
          </Reveal>
          <Reveal>
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full px-8 mt-5 shadow-glow transition-all duration-300 ease-organic hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
            >
              <a href={FULL_YEAR_CALENDAR_URL} target="_blank" rel="noreferrer">
                See prayer times for the entire year
                <ExternalLink className="h-4 w-4 opacity-70" />
              </a>
            </Button>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdhanSchedule; 