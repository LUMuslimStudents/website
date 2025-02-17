import { Facebook, Instagram, Linkedin, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    window.scrollTo(0, 0);
    navigate(path);
  };

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
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#004aac] transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#004aac] transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#004aac] transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
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
              <li>Email: contact@lums.se</li>
              <li>Location: Lund University</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Newsletter</h3>
            <p className="text-muted-foreground mb-4">Stay updated with our latest news</p>
            <div className="flex gap-2">
              <Input placeholder="Your email" className="bg-background" />
              <Button className="bg-[#004aac] hover:bg-[#004aac]/90">Subscribe</Button>
            </div>
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
