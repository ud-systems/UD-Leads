import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import { useIsMobile } from "@/hooks/use-mobile";

/** Menu icon button for mobile header; grey bg. Only visible on mobile. */
export function MobileHeaderMenuButton() {
  const isMobile = useIsMobile();
  const { openMobileMenu } = useMobileMenu();
  if (!isMobile) return null;
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={openMobileMenu}
      className="shrink-0 rounded-[14px] bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border-0 h-10 w-10 min-w-10 min-h-10"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
