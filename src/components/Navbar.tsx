import { Heart } from "lucide-react";
import { NavLink } from "@/components/ui/nav-link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { navCategories } from "@/config/nav";
import { NavCategoryDropdown } from "./navbar/NavCategoryDropdown";
import { NavMobileMenu } from "./navbar/NavMobileMenu";
import { UserMenu } from "./navbar/UserMenu";

interface NavbarProps {
  /** Let page content (e.g. the hero) extend up underneath the navbar */
  overlay?: boolean;
}

export const Navbar = ({ overlay = false }: NavbarProps) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full navbar-fade",
        overlay && "-mb-16 md:-mb-20"
      )}
    >
      <div aria-hidden="true" className="navbar-fade-layer" />
      <div className="container relative z-10 flex h-16 md:h-20 items-center gap-4">
        {/* Logo */}
        <NavLink to="/" className="group flex shrink-0 items-center">
          <img
            src="/logos/logo_minimalist_transparent.png"
            alt="LUMS Logo"
            className="h-12 md:h-16 w-auto transition-transform duration-500 ease-organic group-hover:scale-105"
          />
        </NavLink>

        {/* Desktop categories — left-aligned next to the logo */}
        <nav className="hidden md:flex items-center gap-1">
          {navCategories.map((category) => (
            <NavCategoryDropdown key={category.label} category={category} />
          ))}
        </nav>

        {/* Right-side controls */}
        <div className="ml-auto flex shrink-0 items-center gap-2.5 md:gap-3">
          <Button
            asChild
            size="sm"
            className="h-9 gap-1.5 rounded-full px-3 shadow-glow transition-all duration-300 ease-organic hover:-translate-y-0.5 md:px-4"
          >
            <NavLink to="/donate">
              <Heart className="h-4 w-4" />
              <span className="hidden md:inline">Donate</span>
            </NavLink>
          </Button>

          <UserMenu />

          <NavMobileMenu />
        </div>
      </div>
    </header>
  );
};
