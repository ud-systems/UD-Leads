import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileStack,
  CalendarCheck,
  BarChart3,
  Menu,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FileStack, label: "Leads", href: "/leads" },
  { icon: CalendarCheck, label: "Visits", href: "/visits" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Menu, label: "More", href: "#", isMore: true },
] as const;

interface MobileBottomNavProps {
  onMoreClick: () => void;
}

export function MobileBottomNav({ onMoreClick }: MobileBottomNavProps) {
  const location = useLocation();

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-card safe-area-bottom shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around min-h-16 px-4 py-3 gap-2">
        {navItems.map((item) => {
          const isMore = "isMore" in item && item.isMore;
          const isActive =
            !isMore && location.pathname === item.href;
          const content = (
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 px-3 rounded-xl transition-colors outline-none ring-0 border-0 shadow-none focus:outline-none focus:ring-0 focus:ring-offset-0",
                isActive
                  ? "bg-primary text-white border-0 shadow-none"
                  : "text-muted-foreground active:bg-muted"
              )}
            >
              <item.icon
                className={cn("h-5 w-5", isActive && "text-white")}
              />
              <span className={cn("text-[10px] font-medium", isActive && "text-white")}>{item.label}</span>
            </div>
          );
          if (isMore) {
            return (
              <button
                key="more"
                type="button"
                onClick={onMoreClick}
                className="flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 px-3 rounded-xl text-muted-foreground active:bg-muted"
                aria-label="Open menu"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          }
          return (
            <Link
              key={item.href}
              to={item.href}
              className="flex-1 flex justify-center outline-none ring-0 border-0 shadow-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
