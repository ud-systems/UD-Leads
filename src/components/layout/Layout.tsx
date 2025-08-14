
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useProfile } from "@/hooks/useProfile";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallDesktop, setIsSmallDesktop] = useState(false);
  const { isCollapsed: sidebarCollapsed, setIsCollapsed: setSidebarCollapsed } = useSidebarCollapsed();

  const { data: profile } = useProfile(user?.id);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsSmallDesktop(width >= 768 && width < 1280);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (!user) {
    return <div className="h-screen bg-background">{children}</div>;
  }

  return (
    <div className="h-screen bg-background overflow-x-hidden">
      {/* Mobile Overlay */}
      {isMobile && (
        <div
          className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={closeSidebar}
        />
      )}

      {/* Enhanced Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border/50 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 h-14">
            {/* Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-10 w-10 p-0 rounded-lg hover:bg-accent mobile-touch-target"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Center - Page Title */}
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-foreground truncate">
                Ian Katana
              </h1>
            </div>

            {/* Right Side - Profile */}
            <div className="flex items-center gap-2">
              {/* User Avatar */}
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 rounded-lg hover:bg-accent mobile-touch-target"
                onClick={() => navigate('/profile')}
                title={`${profile?.name || user?.email || 'User'} Profile`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={profile?.avatar_url} 
                    alt={profile?.name || user?.email || 'Profile'} 
                  />
                  <AvatarFallback className="text-xs">
                    {profile?.name ? 
                      profile.name.split(' ').map(n => n[0]).join('').toUpperCase() :
                      user?.email?.charAt(0).toUpperCase() || 'U'
                    }
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`${
          isMobile
            ? `mobile-sidebar ${sidebarOpen ? 'open' : ''}`
            : 'hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:z-50'
        }`}
      >
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onClose={closeSidebar} 
          onCollapsedChange={setSidebarCollapsed}
          isSmallDesktop={isSmallDesktop}
        />
      </div>

      {/* Main Content */}
      <div
        className={`h-screen flex flex-col transition-all duration-300 overflow-x-hidden ${
          isMobile
            ? 'w-full pt-14' // Add top padding for mobile header
            : isSmallDesktop
            ? sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64' // Fixed widths for small desktop
            : sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-80' // Larger widths for larger screens
        }`}
      >
        {/* Page Content */}
        <main className={`flex-1 transition-all duration-300 overflow-x-hidden ${
          isMobile
            ? 'p-3 sm:p-4'
            : 'p-4 sm:p-6 lg:p-8'
        }`} style={{
          backgroundColor: 'hsl(var(--active) / 0.03)'
        }}>
          <div className={`h-full mx-auto transition-all duration-300 overflow-x-hidden ${
            isMobile
              ? 'w-full max-w-full'
              : 'container'
          }`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}