import { NavLink } from "@/components/ui/nav-link";
import { ThemeToggle } from "./ThemeToggle";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { StarMark } from "@/components/IslamicPattern";
import { cn } from "@/lib/utils";

interface NavbarProps {
  /** Let page content (e.g. the hero) extend up underneath the navbar */
  overlay?: boolean;
}

export const Navbar = ({ overlay = false }: NavbarProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const isAdmin = user?.role === 'admin';

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);

  const handleLogout = async () => {
    await signOut();
    setIsMenuOpen(false);
    navigate('/');
  };

  const menuItemClass = (to: string, extra?: string) =>
    cn(
      "block mx-1.5 rounded-xl px-4 py-2.5 text-left transition-colors duration-200",
      isActive(to)
        ? "bg-muted font-medium text-primary"
        : "text-foreground/80 hover:bg-muted hover:text-foreground",
      extra
    );

  return (
    <header className={cn("sticky top-0 z-40 w-full navbar-fade", overlay && "-mb-16 md:-mb-20")}>
      <div aria-hidden="true" className="navbar-fade-layer" />
      <div className="container relative z-10 flex h-16 md:h-20 items-center justify-between">
        {/* Left-aligned LUMS logo */}
        <NavLink
          to="/"
          className="group flex items-center z-20"
        >
          <img
            src="/logos/logo_minimalist_transparent.png"
            alt="LUMS Logo"
            className="h-12 md:h-16 w-auto hover:scale-105 transition-transform duration-500 ease-organic"
          />
        </NavLink>

        {/* Right-aligned controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {user && (
            <span className="inline-flex max-w-[9.5rem] items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground/80 sm:max-w-none">
              <StarMark className="h-3.5 w-3.5 shrink-0 text-gold" />
              <span className="truncate">{user.first_name}</span>
            </span>
          )}
          <ThemeToggle />
          <button
            className="p-2 hover:bg-muted rounded-full transition-colors duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Dropdown Menu */}
        <div className={cn(
          "absolute right-0 top-full mt-2 w-60",
          "rounded-2xl border border-border/70 bg-popover/90 backdrop-blur-xl shadow-lift",
          "transition-all duration-300 ease-organic",
          isMenuOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-2 scale-[0.98] pointer-events-none",
          "z-50"
        )}>
          <nav className="py-2">
            {[
              { to: "/events", label: "Events" },
              { to: "/blog", label: "Blog" },
              { to: "/suggestions", label: "Suggestions" },
              { to: "/membership", label: "Membership" },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={menuItemClass(item.to)}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mx-4 my-2 h-px bg-border/70" />
            {!user && (
              <NavLink
                to="/login"
                className={menuItemClass("/login")}
                onClick={() => setIsMenuOpen(false)}
              >
                Log in
              </NavLink>
            )}
            {!user && (
              <NavLink
                to="/signup"
                className={cn(
                  menuItemClass("/signup"),
                  "border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                Become a member!
              </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={menuItemClass("/admin")}
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </NavLink>
            )}
            {user && (
              <>
                <NavLink
                  to="/"
                  onClick={handleLogout}
                  className={cn(
                    menuItemClass("/signup"),
                    "text-primary hover:bg-destructive/10 transition-colors text-destructive/90 hover:text-destructive"
                  )}
                >
                  Log out
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
