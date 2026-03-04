import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileStack,
  CalendarCheck,
  BarChart3,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FileStack, label: "Leads", href: "/leads" },
  { icon: CalendarCheck, label: "Visits", href: "/visits" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
] as const;

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-card safe-area-bottom shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around min-h-16 px-4 py-3 gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className="flex-1 flex justify-center outline-none ring-0 border-0 shadow-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            >
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 px-3 rounded-xl transition-colors outline-none ring-0 border-0 shadow-none focus:outline-none focus:ring-0 focus:ring-offset-0",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:bg-muted"
                )}
              >
                <item.icon
                  className={cn("h-5 w-5 shrink-0", isActive && "text-primary")}
                />
                <span className={cn("font-medium", isActive && "text-primary")}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
