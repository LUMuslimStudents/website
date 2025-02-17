import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/ui/nav-link";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <NavLink 
          to="/" 
          className="group transition-all flex items-center z-20"
        >
          <span className="text-2xl font-bold bg-gradient-to-r from-[#004aac] via-[#c19434] to-[#004aac] bg-clip-text text-transparent bg-size-300 animate-gradient-slow hover:scale-105 transition-all duration-500 ease-in-out">
            LUMS
          </span>
        </NavLink>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden z-20"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/events" className="text-muted-foreground hover:text-foreground transition-colors">
            Events
          </NavLink>
          <NavLink to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
            Blog
          </NavLink>
          <NavLink to="/suggestions" className="text-muted-foreground hover:text-foreground transition-colors">
            Suggestions
          </NavLink>
          <NavLink to="/membership" className="text-muted-foreground hover:text-foreground transition-colors">
            Membership
          </NavLink>
          <ThemeToggle />
        </nav>

        {/* Mobile Navigation */}
        <div className={`
          fixed inset-0 bg-background/95 backdrop-blur-sm md:hidden
          transition-all duration-300 ease-in-out
          ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}>
          <nav className="flex flex-col items-center justify-center h-full gap-8">
            <NavLink 
              to="/events" 
              className="text-xl font-medium hover:text-[#004aac] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Events
            </NavLink>
            <NavLink 
              to="/blog" 
              className="text-xl font-medium hover:text-[#004aac] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </NavLink>
            <NavLink 
              to="/suggestions" 
              className="text-xl font-medium hover:text-[#004aac] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Suggestions
            </NavLink>
            <NavLink 
              to="/membership" 
              className="text-xl font-medium hover:text-[#004aac] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Membership
            </NavLink>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
};
