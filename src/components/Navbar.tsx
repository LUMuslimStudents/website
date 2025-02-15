import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export const Navbar = () => {
  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="font-bold text-xl">
          LUMS
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/events" className="text-muted-foreground hover:text-foreground transition-colors">
            Events
          </Link>
          <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
            Blog
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
