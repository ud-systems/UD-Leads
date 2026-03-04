import { createContext, useContext } from "react";

type MobileMenuContextValue = {
  openMobileMenu: () => void;
};

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);

export function MobileMenuProvider({
  children,
  openMobileMenu,
}: {
  children: React.ReactNode;
  openMobileMenu: () => void;
}) {
  return (
    <MobileMenuContext.Provider value={{ openMobileMenu }}>
      {children}
    </MobileMenuContext.Provider>
  );
}

export function useMobileMenu(): MobileMenuContextValue {
  const ctx = useContext(MobileMenuContext);
  if (!ctx) {
    return { openMobileMenu: () => {} };
  }
  return ctx;
}
