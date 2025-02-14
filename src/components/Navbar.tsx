
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Navbar = () => {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="/lovable-uploads/2f0b86ee-d92e-4b14-b2bb-9001b82c5ce2.png" 
            alt="LUMS Logo" 
            className="h-12 w-auto"
          />
          <span className="text-sm text-muted-foreground hidden md:inline">
            Lund University Muslim Students
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Link to="/events">
            <Button variant="ghost">Events</Button>
          </Link>
          <Link to="/membership">
            <Button variant="ghost">Membership</Button>
          </Link>
          <Link to="/blog">
            <Button variant="ghost">Blog</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
