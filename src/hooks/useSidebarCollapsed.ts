import { useState } from 'react';

export function useSidebarCollapsed() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Utility function to get responsive classes
  const getResponsiveClasses = (baseClasses: string, collapsedClasses: string = '') => {
    return `${baseClasses} ${isCollapsed ? collapsedClasses : ''}`;
  };

  // Utility function to get grid classes
  const getGridClasses = (baseGrid: string, collapsedGrid: string) => {
    return isCollapsed ? collapsedGrid : baseGrid;
  };

  // Utility function to get spacing classes
  const getSpacingClasses = (baseSpacing: string, collapsedSpacing: string) => {
    return isCollapsed ? collapsedSpacing : baseSpacing;
  };

  return {
    isCollapsed,
    setIsCollapsed,
    getResponsiveClasses,
    getGridClasses,
    getSpacingClasses,
  };
} 