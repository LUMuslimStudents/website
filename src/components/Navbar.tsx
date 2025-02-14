
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Navbar = () => {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">StudentAssoc</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Link to="/events">
            <Button variant="ghost">Events</Button>
          </Link>
          <Link to="/membership">
            <Button variant="ghost">Membership</Button>
          </Link>
          <Link to="/login">
            <Button variant="default">Sign In</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
