
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Store, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Map, 
  Settings,
  LogOut,
  X,
  Target,
  Building,
  User,
  PanelLeftClose,
  PanelLeft,
  Clock
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";


const navigationItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Store, label: "Leads", href: "/leads" },
  { icon: Calendar, label: "Visits", href: "/visits" },
  { icon: Clock, label: "Followup", href: "/scheduled-followups" },
  { icon: Target, label: "Performance+", href: "/performance-enhanced" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Map, label: "Territories", href: "/territory" },

  { icon: User, label: "Profile", href: "/profile" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onClose?: () => void;
  isSmallDesktop?: boolean;
}

export function Sidebar({ collapsed = false, onCollapsedChange, onClose, isSmallDesktop = false }: SidebarProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: companyLogoUrl } = useCompanyLogo();

  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      let newGreeting = "";
      
      if (hour < 12) {
        newGreeting = "morning";
      } else if (hour < 17) {
        newGreeting = "afternoon";
      } else {
        newGreeting = "evening";
      }
      
      setGreeting(newGreeting);
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const capitalizeWords = (str: string) => {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getUserDisplayName = () => {
    let name = "";
    if (profile?.name) name = profile.name;
    else if (user?.user_metadata?.name) name = user.user_metadata.name;
    else if (user?.email) name = user.email.split('@')[0];
    else name = "User";
    
    return capitalizeWords(name);
  };

  const handleNavigationClick = () => {
    // Close sidebar on mobile when navigation item is clicked
    if (window.innerWidth < 768) {
      onClose?.();
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-screen bg-gradient-sidebar text-white transition-all duration-300",
      // Mobile styling
      "lg:rounded-tr-lg lg:fixed lg:left-0 lg:top-0 lg:z-50",
      // Responsive desktop width based on screen size
      collapsed 
        ? isSmallDesktop ? "lg:w-16" : "lg:w-20"
        : isSmallDesktop ? "lg:w-64" : "lg:w-80",
      // Mobile width
      "w-80",
      // Dark mode improvements
      "dark:border-r dark:border-slate-800"
    )}>
      {/* Mobile Close Button */}
      <div className="flex justify-between items-center p-3 lg:p-4 border-b border-white/20 lg:hidden dark:border-slate-700">
        <div className="font-semibold text-white text-base lg:text-lg dark:text-white">Menu</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 text-white hover:bg-gradient-primary/20 dark:text-white dark:hover:bg-gradient-primary/20 mobile-touch-target"
        >
          <X className="h-4 w-4 lg:h-5 lg:w-5" />
        </Button>
      </div>

      {/* Company Logo and Greeting - Hidden on collapsed, shown on expanded */}
      {!collapsed && (
        <div className="px-4 py-6 border-b border-white/20 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            {/* Company Logo */}
            {companyLogoUrl ? (
              <img
                src={companyLogoUrl}
                alt="Company Logo"
                className="w-[82px] h-[82px] object-contain rounded-lg flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-[82px] h-[82px] bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">UH</span>
              </div>
            )}
            
            {/* Greeting and Role */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-semibold text-white leading-none">
                {capitalizeWords(greeting)},
              </h2>
              <h2 className="text-xl font-semibold text-white leading-none mt-2">
                {getUserDisplayName()}
              </h2>
            </div>

            {/* Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCollapsedChange?.(true)}
              className="h-8 w-8 p-0 text-white hover:bg-white/10 dark:text-white dark:hover:bg-white/10 mobile-touch-target"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Collapsed Header with Expand Button */}
      {collapsed && (
        <div className="px-2 py-4 border-b border-white/20 dark:border-slate-700">
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCollapsedChange?.(false)}
              className="h-8 w-8 p-0 text-white hover:bg-white/10 dark:text-white dark:hover:bg-white/10 mobile-touch-target"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Navigation Items - Compact vertical stack like the image */}
      <div className="flex-1 flex flex-col py-3 lg:py-4 space-y-1 lg:space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <Link key={item.href} to={item.href} onClick={handleNavigationClick}>
              <div
                className={cn(
                  "flex items-center transition-all duration-200 cursor-pointer group relative mobile-touch-target",
                  collapsed 
                    ? "justify-center w-10 h-10 mx-auto rounded-lg" 
                    : "px-3 lg:px-4 py-2 lg:py-3 mx-2 rounded-lg",
                  isActive 
                    ? "bg-white text-primary shadow-lg dark:bg-primary dark:text-white" 
                    : "text-white hover:bg-white/10 dark:text-white dark:hover:bg-white/10"
                )}
              >
                <item.icon className={cn(
                  "transition-all duration-200",
                  collapsed ? "h-4 w-4 lg:h-5 lg:w-5" : "h-4 w-4 mr-2 lg:mr-3"
                )} />
                {!collapsed && (
                  <span className={cn(
                    "flex-1 text-left font-medium transition-colors text-base",
                    isActive ? "text-primary dark:text-white" : "text-white group-hover:text-white dark:text-white dark:group-hover:text-white"
                  )}>
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Logout Section - Bottom */}
      <div className="p-2 lg:p-3 border-t border-white/20 dark:border-slate-700">
        <Button
          variant="ghost"
          onClick={() => {
            signOut();
            onClose?.();
          }}
          className={cn(
            "w-full transition-all duration-200 cursor-pointer group relative mobile-touch-target",
            collapsed 
              ? "justify-center w-10 h-10 mx-auto rounded-lg" 
              : "justify-start px-3 lg:px-4 py-2 lg:py-3 mx-2 rounded-lg",
            "text-white hover:bg-white/10 dark:text-white dark:hover:bg-white/10"
          )}
        >
          <LogOut className={cn(
            "transition-all duration-200",
            collapsed ? "h-4 w-4 lg:h-5 lg:w-5" : "h-4 w-4 mr-2 lg:mr-3"
          )} />
          {!collapsed && (
            <span className="flex-1 text-left font-medium transition-colors text-base text-white group-hover:text-white dark:text-white dark:group-hover:text-white">
              Logout
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
