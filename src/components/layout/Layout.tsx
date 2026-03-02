
import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { MobileMenu } from "./MobileMenu";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallDesktop, setIsSmallDesktop] = useState(false);
  const { isCollapsed: sidebarCollapsed, setIsCollapsed: setSidebarCollapsed } = useSidebarCollapsed();

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

  const openMobileMenu = () => setMobileMenuOpen(true);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  if (!user) {
    return <div className="h-screen bg-background">{children}</div>;
  }

  return (
    <div className="h-screen bg-background">
      {/* Mobile: card-style menu overlay (opened from Bottom Nav "More") */}
      {isMobile && (
        <MobileMenu
          open={mobileMenuOpen}
          onClose={closeMobileMenu}
          onNavigate={closeMobileMenu}
        />
      )}

      {/* Sidebar: desktop only; hidden on mobile (mobile uses bottom nav + menu) */}
      <div
        className={`${
          isMobile
            ? 'hidden'
            : 'hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:z-50'
        }`}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onClose={() => {}}
          onCollapsedChange={setSidebarCollapsed}
          isSmallDesktop={isSmallDesktop}
        />
      </div>

      {/* Main Content */}
      <div
        className={`h-screen flex flex-col transition-all duration-300 ${
          isMobile
            ? 'w-full pt-0 pb-20' // No top bar; bottom nav (increased padding)
            : isSmallDesktop
            ? sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
            : sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-80'
        }`}
      >
        {/* Page Content */}
        <main className={`flex-1 transition-all duration-300 bg-content overflow-auto ${
          isMobile
            ? 'p-2 sm:p-3'
            : 'p-3 sm:p-4 lg:p-6'
        }`}>
          <div className={`h-full transition-all duration-300 ${
            isMobile
              ? 'w-full max-w-full'
              : 'w-full max-w-none'
          }`}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile: persistent bottom navigation */}
      {isMobile && (
        <MobileBottomNav onMoreClick={openMobileMenu} />
      )}
    </div>
  );
}