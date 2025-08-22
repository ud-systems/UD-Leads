import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

export interface Permission {
  resource: string;
  actions: string[];
}

export interface RolePermissions {
  [role: string]: Permission[];
}

// Comprehensive permission system
const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { resource: 'retailers', actions: ['create', 'read', 'update', 'delete', 'bulk_operations'] },
    { resource: 'suppliers', actions: ['create', 'read', 'update', 'delete', 'bulk_operations'] },
    { resource: 'visits', actions: ['create', 'read', 'update', 'delete', 'bulk_operations'] },
    { resource: 'territories', actions: ['create', 'read', 'update', 'delete', 'assign'] },
    { resource: 'analytics', actions: ['read', 'export', 'generate_reports'] },
    { resource: 'performance', actions: ['read', 'export', 'generate_reports'] },

    { resource: 'settings', actions: ['read', 'update', 'system_config'] },
    { resource: 'data_management', actions: ['import', 'export', 'backup', 'restore'] },
    { resource: 'reports', actions: ['create', 'read', 'update', 'delete', 'schedule', 'export'] },
    { resource: 'audit_logs', actions: ['read'] },
    { resource: 'roles', actions: ['create', 'read', 'update', 'delete', 'assign'] },
  ],
  manager: [
    { resource: 'users', actions: ['read', 'update'] },
    { resource: 'retailers', actions: ['create', 'read', 'update', 'delete', 'bulk_operations'] },
    { resource: 'suppliers', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'visits', actions: ['create', 'read', 'update', 'delete', 'bulk_operations'] },
    { resource: 'territories', actions: ['read', 'update', 'assign'] },
    { resource: 'analytics', actions: ['read', 'export'] },
    { resource: 'performance', actions: ['read', 'export'] },

    { resource: 'settings', actions: ['read', 'update'] },
    { resource: 'data_management', actions: ['import', 'export'] },
    { resource: 'reports', actions: ['create', 'read', 'update', 'export'] },
    { resource: 'audit_logs', actions: ['read'] },
  ],
  salesperson: [
    { resource: 'retailers', actions: ['create', 'read', 'update'] },
    { resource: 'suppliers', actions: ['read'] },
    { resource: 'visits', actions: ['create', 'read', 'update'] },
    { resource: 'territories', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'performance', actions: ['read'] },
    { resource: 'settings', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
  ],
  analyst: [
    { resource: 'retailers', actions: ['read'] },
    { resource: 'suppliers', actions: ['read'] },
    { resource: 'visits', actions: ['read'] },
    { resource: 'territories', actions: ['read'] },
    { resource: 'analytics', actions: ['read', 'export', 'generate_reports'] },
    { resource: 'performance', actions: ['read', 'export', 'generate_reports'] },
    { resource: 'settings', actions: ['read'] },
    { resource: 'reports', actions: ['create', 'read', 'update', 'export'] },
    { resource: 'audit_logs', actions: ['read'] },
  ],
  viewer: [
    { resource: 'retailers', actions: ['read'] },
    { resource: 'suppliers', actions: ['read'] },
    { resource: 'visits', actions: ['read'] },
    { resource: 'territories', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'performance', actions: ['read'] },
    { resource: 'settings', actions: ['read'] },
  ],
};

export function useRoleAccess() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);

  const userRole = profile?.role || 'viewer';
  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.viewer;

  const hasPermission = (resource: string, action: string): boolean => {
    const resourcePermission = permissions.find(p => p.resource === resource);
    return resourcePermission?.actions.includes(action) || false;
  };

  const canCreate = (resource: string): boolean => hasPermission(resource, 'create');
  const canRead = (resource: string): boolean => hasPermission(resource, 'read');
  const canUpdate = (resource: string): boolean => hasPermission(resource, 'update');
  const canDelete = (resource: string): boolean => hasPermission(resource, 'delete');
  const canManage = (resource: string): boolean => hasPermission(resource, 'manage');
  const canBulkOperations = (resource: string): boolean => hasPermission(resource, 'bulk_operations');
  const canExport = (resource: string): boolean => hasPermission(resource, 'export');
  const canGenerateReports = (resource: string): boolean => hasPermission(resource, 'generate_reports');

  // Specific permission checks
  const canManageUsers = canManage('users');
  const canManageRetailers = canCreate('retailers') && canUpdate('retailers') && canDelete('retailers');
  const canManageSuppliers = canCreate('suppliers') && canUpdate('suppliers') && canDelete('suppliers');
  const canManageVisits = canCreate('visits') && canUpdate('visits') && canDelete('visits');
  const canManageTerritories = canCreate('territories') && canUpdate('territories') && canDelete('territories');
  const canViewAnalytics = canRead('analytics');
  const canViewPerformance = canRead('performance');

  const canManageSettings = canUpdate('settings');
  const canManageReports = canCreate('reports') && canUpdate('reports');
  const canViewAuditLogs = canRead('audit_logs');

  // Navigation permissions
  const canAccessDashboard = true; // All users can access dashboard
  const canAccessRetailers = canRead('retailers');
  const canAccessVisits = canRead('visits');
  const canAccessAnalytics = canRead('analytics');
  const canAccessPerformance = canRead('performance');
  const canAccessTerritory = canRead('territories');

  const canAccessSettings = canRead('settings');
  const canAccessAdmin = userRole === 'admin';

  return {
    userRole,
    permissions,
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canManage,
    canBulkOperations,
    canExport,
    canGenerateReports,
    
    // Specific permissions
    canManageUsers,
    canManageRetailers,
    canManageSuppliers,
    canManageVisits,
    canManageTerritories,
    canViewAnalytics,
    canViewPerformance,
    canManageSettings,
    canManageReports,
    canViewAuditLogs,
    
    // Navigation permissions
    canAccessDashboard,
    canAccessRetailers,
    canAccessVisits,
    canAccessAnalytics,
    canAccessPerformance,
    canAccessTerritory,
    canAccessSettings,
    canAccessAdmin,
    
    // Role checks
    isAdmin: userRole === 'admin',
    isManager: userRole === 'manager',
    isSalesperson: userRole === 'salesperson',
    isAnalyst: userRole === 'analyst',
    isViewer: userRole === 'viewer',
  };
} 