import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, Permission, rolePermissions as defaultRolePermissions } from '@/lib/permissions';

interface PermissionsContextType {
  permissions: Record<Role, Permission[]>;
  updatePermission: (role: Role, permission: Permission, allowed: boolean) => void;
  resetPermissions: () => void;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<Record<Role, Permission[]>>(defaultRolePermissions);

  useEffect(() => {
    const savedPermissions = localStorage.getItem('nexus_permissions');
    if (savedPermissions) {
      try {
        setPermissions(JSON.parse(savedPermissions));
      } catch (e) {
        console.error('Failed to parse permissions from localStorage', e);
      }
    }
  }, []);

  const updatePermission = (role: Role, permission: Permission, allowed: boolean) => {
    setPermissions(prev => {
      const rolePerms = prev[role] || [];
      let newRolePerms;
      
      if (allowed) {
        if (!rolePerms.includes(permission)) {
          newRolePerms = [...rolePerms, permission];
        } else {
          newRolePerms = rolePerms;
        }
      } else {
        newRolePerms = rolePerms.filter(p => p !== permission);
      }
      
      const newPermissions = { ...prev, [role]: newRolePerms };
      localStorage.setItem('nexus_permissions', JSON.stringify(newPermissions));
      return newPermissions;
    });
  };

  const resetPermissions = () => {
    setPermissions(defaultRolePermissions);
    localStorage.removeItem('nexus_permissions');
  };

  return (
    <PermissionsContext.Provider value={{ permissions, updatePermission, resetPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider');
  }
  return context;
}
