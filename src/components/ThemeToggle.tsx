import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="group hover:bg-transparent"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all group-hover:text-blue-500 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all group-hover:text-blue-500 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

/**
 * Labeled pill version of the theme toggle: keeps the animated sun/moon icon but
 * pairs it with a "Dark mode" / "Light mode" label. Used in the footer.
 */
export function ThemeTogglePill() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-4 py-2 text-sm text-muted-foreground transition-all duration-300 ease-organic hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground hover:shadow-soft"
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        <Sun className="absolute h-5 w-5 rotate-0 scale-100 transition-all group-hover:text-blue-500 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all group-hover:text-blue-500 dark:rotate-0 dark:scale-100" />
      </span>
      <span>{mounted ? (isDark ? "Dark mode" : "Light mode") : "Theme"}</span>
    </button>
  );
}