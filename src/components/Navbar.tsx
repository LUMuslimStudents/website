import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/ui/nav-link";
import { ThemeToggle } from "./ThemeToggle";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="border-b bg-background">
      <div className="container flex h-20 items-center justify-between relative">
        {/* Left-aligned LUMS logo */}
        <NavLink
          to="/"
          className="group transition-all flex items-center z-20"
        >
          <img
            src="/logos/logo_minimalist_transparent.png"
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
            <div className="h-px bg-border my-2" />
            {!user && (
              <NavLink
                to="/login"
                className="block px-4 py-2 hover:bg-muted transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </NavLink>
            )}
            {!user && (
              <NavLink
                to="/signup"
                className="block px-4 py-2 hover:bg-muted transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Become a member!
              </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to="/admin"
                className="block px-4 py-2 hover:bg-muted transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </NavLink>
            )}
            {user && (
              <>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 hover:bg-muted transition-colors text-red-500 hover:text-red-600 font-medium"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
