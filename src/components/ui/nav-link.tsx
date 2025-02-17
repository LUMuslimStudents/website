import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  children: React.ReactNode;
  to: string;
  className?: string;
  delay?: number;
}

export const NavLink = ({ 
  children, 
  to, 
  className, 
  delay = 600, // Reduced delay to match animation duration
  ...props 
}: NavLinkProps) => {
  const navigate = useNavigate();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
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