import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileStack,
  CalendarCheck,
  BarChart3,
  MapPin,
} from "lucide-react";

const leftNavItems = [
  { icon: FileStack, label: "Leads", href: "/leads" },
  { icon: CalendarCheck, label: "Visits", href: "/visits" },
] as const;

const rightNavItems = [
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: MapPin, label: "Territory", href: "/territory" },
] as const;

const dashboardHref = "/";

export function MobileBottomNav() {
  const location = useLocation();
  const isDashboardActive = location.pathname === dashboardHref;

  const linkClass = "flex-1 flex flex-col items-center justify-center gap-0.5 min-h-12 px-1 py-1 transition-colors active:bg-muted/80 outline-none ring-0 border-0 shadow-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none";

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-card safe-area-bottom shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.08)] flex items-center justify-around min-h-12 px-1.5 py-1.5 gap-0">
      {leftNavItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link key={item.href} to={item.href} className={linkClass}>
            <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-[6px] font-medium whitespace-nowrap", isActive ? "text-primary" : "text-muted-foreground")}>{item.label}</span>
          </Link>
        );
      })}
      <Link
        to={dashboardHref}
        className={cn(
          "flex-1 flex flex-col items-center justify-center min-h-12 px-2 py-1 transition-colors outline-none ring-0 border-0 shadow-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none active:bg-muted/80",
          isDashboardActive ? "text-primary-foreground" : "text-muted-foreground"
        )}
      >
        <span className={cn("flex items-center justify-center rounded-[14px] p-1.5 shrink-0 text-white", isDashboardActive ? "bg-primary" : "bg-black/90")}>
          <LayoutDashboard className="h-6 w-6 shrink-0" />
        </span>
      </Link>
      {rightNavItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link key={item.href} to={item.href} className={linkClass}>
            <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-[6px] font-medium whitespace-nowrap", isActive ? "text-primary" : "text-muted-foreground")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
