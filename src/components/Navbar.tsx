import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/ui/nav-link";
import { ThemeToggle } from "./ThemeToggle";
import { Menu } from "lucide-react";
import { useState } from "react";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b bg-background">
      <div className="container flex h-20 items-center justify-between relative">
        {/* Left-aligned LUMS logo */}
        <NavLink 
          to="/" 
          className="group transition-all flex items-center z-20"
        >
          <img 
            src="/lovable-uploads/logo_minimalist_transparent.png"
            alt="LUMS Logo"
            className="h-16 w-auto hover:scale-105 transition-all duration-500 ease-in-out"
          />
        </NavLink>

        {/* Right-aligned menu button */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="p-2 hover:bg-muted rounded-full"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Dropdown Menu */}
        <div className={`
          absolute right-0 top-full mt-2 w-48 
          bg-background border rounded-lg shadow-lg
          transition-all duration-200 ease-in-out
          ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
          z-50
        `}>
          <nav className="py-2">
            <NavLink 
              to="/events" 
              className="block px-4 py-2 hover:bg-muted transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Events
            </NavLink>
            <NavLink 
              to="/blog" 
              className="block px-4 py-2 hover:bg-muted transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </NavLink>
            <NavLink 
              to="/suggestions" 
              className="block px-4 py-2 hover:bg-muted transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Suggestions
            </NavLink>
            <NavLink 
              to="/membership" 
              className="block px-4 py-2 hover:bg-muted transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Membership
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
};
