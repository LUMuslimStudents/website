import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  flattenNavItems,
  isItemActive,
  navCategories,
  type NavCategory,
  type NavItem,
} from "@/config/nav";
import { NavLinkRow, PreviewSlot } from "./shared";

/**
 * Mobile navigation. The hamburger opens a sheet (which handles overlay,
 * scroll-lock, focus-trap and Escape for us). Categories are single-open
 * accordions; pressing a link "peeks" its description into the shared preview
 * slot at the bottom, and releasing navigates.
 */
export const NavMobileMenu = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<NavItem | null>(null);

  // Open the accordion for whichever category contains the current route.
  const activeCategory: NavCategory | undefined = navCategories.find((cat) =>
    flattenNavItems(cat).some((item) => isItemActive(item, pathname))
  );

  const close = () => {
    setOpen(false);
    setActiveItem(null);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="rounded-full p-2 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-[88%] max-w-sm flex-col gap-0 border-border/70 menu-frost p-0"
      >
        <SheetHeader className="border-b border-border/60 px-5 py-4 text-left">
          <SheetTitle className="font-display">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          <Accordion
            type="single"
            collapsible
            defaultValue={activeCategory?.label}
          >
            {navCategories.map((category) => (
              <AccordionItem
                key={category.label}
                value={category.label}
                className="border-border/50"
              >
                <AccordionTrigger className="px-2 text-sm font-medium hover:no-underline">
                  {category.label}
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  {category.groups.map((group, gi) => (
                    <div key={group.label ?? gi} className={cn(gi > 0 && "mt-1")}>
                      {group.label && (
                        <p className="px-3 pb-1 pt-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                          {group.label}
                        </p>
                      )}
                      {group.items.map((item) => (
                        <NavLinkRow
                          key={item.label}
                          item={item}
                          active={isItemActive(item, pathname)}
                          onActivate={setActiveItem}
                          onNavigate={close}
                        />
                      ))}
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="border-t border-border/60 p-3">
          <PreviewSlot item={activeItem} variant="bottom" />
        </div>
      </SheetContent>
    </Sheet>
  );
};
