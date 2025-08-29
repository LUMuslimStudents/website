import { Facebook, Instagram, Linkedin, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export const Footer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigation = (path: string) => {
    window.scrollTo(0, 0);
    navigate(path);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([
          { email, subscribed_at: new Date().toISOString() }
        ]);

      if (error) throw error;

      toast({
        title: "Successfully subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      });
      
      setEmail("");
    } catch (error) {
      toast({
        title: "Subscription failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const socialLinks = [
    {
      name: "Instagram",
      href: "https://www.instagram.com/muslimstudentslu/",
      icon: Instagram
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/groups/12774879/",
      icon: Linkedin
    },
    {
      name: "Facebook",
      href: "https://www.facebook.com/profile.php?id=100086599076992",
      icon: Facebook
    }
  ];

  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center sm:text-left">
            <h3 className="font-bold text-lg mb-4">About LUMS</h3>
            <p className="text-muted-foreground">
              Supporting Muslim students at Lund University since 2014.
            </p>
            <div className="flex gap-4 mt-4 justify-center sm:justify-start">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-[#004aac] transition-colors"
                  aria-label={link.name}
                >
                  <link.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => handleNavigation('/events')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Upcoming Events
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/membership')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Join Us
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/suggestions')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Give Feedback
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                Email: <a 
                  href="mailto:muslimskastudenterlu@gmail.com" 
                  className="hover:text-[#004aac] transition-colors"
                >
                  muslimskastudenterlu@gmail.com
                </a>
              </li>
              <li>Location: Lund University</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Newsletter</h3>
            <p className="text-muted-foreground mb-4">Stay updated with our latest news</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input 
                type="email"
                placeholder="Your email" 
                className="bg-background"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button 
                type="submit" 
                className="bg-[#004aac] hover:bg-[#004aac]/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Subscribe"
                )}
              </Button>
            </form>
          </div>
        </div>
        <div className="mt-8 md:mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} LUMS - Lund University Muslim Students.</p>
          <p className="mt-2">Developed with ❤️ by LUMS Tech Team</p>
        </div>
      </div>
    </footer>
  );
};
