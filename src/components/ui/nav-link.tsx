import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  children: React.ReactNode;
  to: string;
  className?: string;
  delay?: number;
}

/** "/events/" and "/events" are the same route for our purposes. */
const normalizePath = (path: string) => {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
};

export const NavLink = ({ 
  children, 
  to, 
  className, 
  delay = 600, // Reduced delay to match animation duration
  ...props 
}: NavLinkProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const targetPath = normalizePath(to.split(/[?#]/)[0]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Clicking a link to the page we're already on (e.g. the logo while on
    // the landing page): the page-exit animation would fade the page out and
    // — since the route never changes, the page never remounts — nothing
    // would ever bring it back. Skip the animation and just scroll up.
    if (normalizePath(pathname) === targetPath) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Add exit animation class to current page
    document.querySelector('.page')?.classList.add('page-exit');
    
    // First scroll to top with smooth behavior
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Wait for the animation to complete
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Then navigate
    navigate(to);
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={cn(
        "transition-all duration-300",
        "hover:opacity-80",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}; 