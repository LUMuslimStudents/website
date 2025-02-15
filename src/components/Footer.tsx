import { Facebook, Instagram, Linkedin, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="group">
            <h3 className="text-lg font-semibold mb-4 relative">
              Contact Us
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </h3>
            <div className="space-y-2">
              <a 
                href="mailto:muslimskastudenterlu@gmail.com" 
                className="flex items-center text-muted-foreground hover:text-primary transition-all duration-300 transform hover:translate-x-1"
              >
                <Mail className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                muslimskastudenterlu@gmail.com
              </a>
            </div>
          </div>
          <div className="group">
            <h3 className="text-lg font-semibold mb-4 relative">
              Follow Us
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </h3>
            <div className="flex space-x-6">
              <a
                href="https://www.instagram.com/muslimstudentslu/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-all duration-300 transform hover:scale-110 hover:-translate-y-1"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=100086599076992"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-all duration-300 transform hover:scale-110 hover:-translate-y-1"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href="https://www.linkedin.com/groups/12774879/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-all duration-300 transform hover:scale-110 hover:-translate-y-1"
              >
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground opacity-0 animate-in fade-in duration-700 delay-300">
          <p>© {new Date().getFullYear()} LUMS - Lund University Muslim Students. All rights reserved.</p>
          <p className="mt-2">Developed with ❤️ by LUMS Tech Team</p>
        </div>
      </div>
    </footer>
  );
};
