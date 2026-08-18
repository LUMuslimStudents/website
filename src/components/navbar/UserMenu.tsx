import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  Moon,
  Sun,
  User as UserIcon,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { StarMark } from "@/components/IslamicPattern";
import { cn } from "@/lib/utils";

/** Consistent padding + icon spacing for every row in the menu. */
const itemClass = "gap-2.5 rounded-lg px-3 py-2.5 [&>svg]:h-4 [&>svg]:w-4";

/**
 * Account pill in the navbar. Logged in: shows the member's name and a menu with
 * Profile (coming soon), Admin (admins only), an animated theme toggle, and Log
 * out. Logged out: a compact account button whose menu offers Log in / Become a
 * member plus the theme toggle.
 *
 * `modal={false}` stops Radix from locking body scroll (which otherwise shifts
 * the whole page left when the menu opens).
 */
export const UserMenu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const isAdmin = user?.role === "admin";

  const ThemeMenuItem = (
    <DropdownMenuItem
      className={itemClass}
      onSelect={(e) => {
        e.preventDefault();
        setTheme(theme === "dark" ? "light" : "dark");
      }}
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        <Sun className="absolute h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
      </span>
      Theme
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {user ? (
            <>
              <StarMark className="h-3.5 w-3.5 shrink-0 text-gold" />
              <span className="max-w-[7rem] truncate">{user.first_name}</span>
            </>
          ) : (
            <UserIcon className="h-4 w-4" />
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-60 rounded-xl border-border/70 menu-frost p-1.5 shadow-lift"
      >
        {user ? (
          <>
            <DropdownMenuLabel className="truncate px-3 py-2 text-muted-foreground">
              Signed in as{" "}
              <span className="text-foreground">{user.first_name}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className={cn(itemClass, "cursor-default")} disabled>
              <UserIcon />
              Profile
              <span className="ml-auto text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                soon
              </span>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem
                className={itemClass}
                onSelect={() => navigate("/admin")}
              >
                <LayoutDashboard />
                Admin
              </DropdownMenuItem>
            )}
            {ThemeMenuItem}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={cn(
                itemClass,
                "text-destructive focus:text-destructive"
              )}
              onSelect={async () => {
                await signOut();
                navigate("/");
              }}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem
              className={itemClass}
              onSelect={() => navigate("/login")}
            >
              <LogIn />
              Log in
            </DropdownMenuItem>
            <DropdownMenuItem
              className={cn(itemClass, "text-primary focus:text-primary")}
              onSelect={() => navigate("/signup")}
            >
              <UserPlus />
              Become a member
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {ThemeMenuItem}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
