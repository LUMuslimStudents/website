import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export const Navbar = () => {
  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link 
          to="/" 
          className="group transition-all flex items-center"
        >
          <span className="text-2xl font-bold bg-gradient-to-r from-[#004aac] via-[#c19434] to-[#004aac] bg-clip-text text-transparent bg-size-300 animate-gradient-slow hover:scale-105 transition-all duration-500 ease-in-out">
            LUMS
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/events" className="text-muted-foreground hover:text-foreground transition-colors">
            Events
          </Link>
          <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
            Blog
          </Link>
          <Link to="/suggestions" className="text-muted-foreground hover:text-foreground transition-colors">
            Suggestions
          </Link>
          <Link to="/membership" className="text-muted-foreground hover:text-foreground transition-colors">
            Membership
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};
