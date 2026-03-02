import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  FileText,
  Users,
  MapPin,
  Settings,
  User,
  X,
  Menu,
  Bell,
  ChevronRight,
  LucideIcon,
} from "lucide-react";

export interface MenuCardItem {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href: string;
}

const menuItems: MenuCardItem[] = [
  {
    icon: BarChart3,
    title: "Analytics",
    subtitle: "Detailed performance metrics and trends",
    href: "/analytics",
  },
  {
    icon: TrendingUp,
    title: "Performance",
    subtitle: "Salesperson and team rankings",
    href: "/performance-enhanced",
  },
  {
    icon: FileText,
    title: "Drafts",
    subtitle: "Continue saved lead registrations",
    href: "/leads",
  },
  {
    icon: Users,
    title: "Follow-ups",
    subtitle: "Manage scheduled follow-ups",
    href: "/scheduled-followups",
  },
  {
    icon: MapPin,
    title: "Territories",
    subtitle: "View and manage territories",
    href: "/territory",
  },
  {
    icon: Settings,
    title: "Settings",
    subtitle: "App settings and preferences",
    href: "/settings",
  },
  {
    icon: User,
    title: "Profile",
    subtitle: "View and edit your profile",
    href: "/profile",
  },
];

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: () => void;
}

export function MobileMenu({ open, onClose, onNavigate }: MobileMenuProps) {
  const location = useLocation();

  const handleLinkClick = () => {
    onNavigate?.();
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        aria-hidden
        onClick={onClose}
      />
      {/* Menu panel - full screen on mobile */}
      <div
        className={cn(
          "fixed inset-0 z-50 w-full h-full bg-card flex flex-col lg:hidden",
          "animate-in fade-in-0 duration-200"
        )}
      >
        {/* Header: MENU title, bell, close - padding aligned with content */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-2">
            <Menu className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold text-lg uppercase tracking-wide text-foreground">
              Menu
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-lg"
              onClick={() => {}}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg bg-destructive hover:bg-black text-destructive-foreground hover:text-white transition-colors"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Card-style nav items - same horizontal padding as header */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleLinkClick}
                className="block"
              >
                <div
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/50 hover:bg-muted transition-colors",
                    isActive && "border-primary/40 bg-primary/5"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background border border-border">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.subtitle}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
