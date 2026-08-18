import { useNavigate } from "react-router-dom";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa6";
import { PatternBackground, OrnamentDivider, StarMark } from "@/components/IslamicPattern";
import { ThemeTogglePill } from "@/components/ThemeToggle";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { useState } from "react";
// import { useToast } from "@/components/ui/use-toast";
// import { Loader2 } from "lucide-react";

export const Footer = () => {
  const navigate = useNavigate();
  // const { toast } = useToast();
  // const [email, setEmail] = useState("");
  // const [isLoading, setIsLoading] = useState(false);

  const handleNavigation = (path: string) => {
    window.scrollTo(0, 0);
    navigate(path);
  };

  // const handleSubscribe = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!email) return;

  //   setIsLoading(true);
  //   try {
  //     // Mock subscription success for UI flow
  //     await new Promise(resolve => setTimeout(resolve, 800));

  //     toast({
  //       title: "Successfully subscribed!",
  //       description: "Thank you for subscribing to our newsletter.",
  //     });

  //     setEmail("");
  //   } catch (error) {
  //     toast({
  //       title: "Subscription failed",
  //       description: "Please try again later.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const socialLinks = [
    {
      name: "Instagram",
      href: "https://www.instagram.com/muslimstudentslu/",
      icon: FaInstagram
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/groups/12774879/",
      icon: FaLinkedin
    },
    {
      name: "Facebook",
      href: "https://www.facebook.com/profile.php?id=100086599076992",
      icon: FaFacebook
    }
  ];

  return (
    <footer className="relative overflow-hidden border-t border-border/60 bg-card/50">
      <div className="hairline-gradient absolute top-0 left-0" />
      <PatternBackground className="opacity-[0.32] dark:opacity-[0.26]" />
      <div className="container relative py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 md:gap-8">
          <div className="text-center sm:text-left">
            <img
              src="/logos/logo_minimalist_transparent.png"
              alt="LUMS Logo"
              className="h-14 w-auto mx-auto sm:mx-0 mb-4"
            />
            <p className="text-muted-foreground">
              Supporting Muslim students at Lund University since 2023.
            </p>
            <div className="flex gap-3 mt-5 justify-center sm:justify-start">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/60 text-muted-foreground transition-all duration-300 ease-organic hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-soft"
                  aria-label={link.name}
                >
                  <link.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <div className="mt-5 flex justify-center sm:justify-start">
              <ThemeTogglePill />
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-display text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() => handleNavigation('/events')}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <StarMark className="h-2.5 w-2.5 shrink-0 text-gold/70" />
                  Upcoming Events
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/membership')}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <StarMark className="h-2.5 w-2.5 shrink-0 text-gold/70" />
                  Join Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('/suggestions')}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <StarMark className="h-2.5 w-2.5 shrink-0 text-gold/70" />
                  Give Feedback
                </button>
              </li>
            </ul>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-display text-lg mb-4">Contact</h3>
            <ul className="space-y-2.5 text-muted-foreground">
              <li>
                Email:{" "}
                <a
                  href="mailto:muslimskastudenterlu@gmail.com"
                  className="hover:text-primary transition-colors"
                >
                  muslimskastudenterlu@gmail.com
                </a>
              </li>
              <li>Location: Lund University</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 md:mt-16 flex flex-col items-center gap-3">
          <OrnamentDivider className="mb-1" />
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} LUMS - Lund University Muslim Students.
          </p>
          <p className="text-sm text-muted-foreground/80">
            Developed with ❤️ by LUMS Tech Team
          </p>
        </div>
      </div>
    </footer>
  );
};
