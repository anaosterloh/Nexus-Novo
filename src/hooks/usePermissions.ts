import { useApp } from '@/context/AppContext';
import { usePermissionsContext } from '@/context/PermissionsContext';
import { Permission, Role } from '@/lib/permissions';

export function usePermissions() {
  const { user } = useApp();
  const { permissions } = usePermissionsContext();
  
  const can = (permission: Permission) => {
    if (!user) return false;

    // Check for new granular permissions first
    if (user.permissions?.modules) {
      const modules = user.permissions.modules;
      
      switch (permission) {
        // Inventory & Logistics & Purchasing
        case 'view_products':
        case 'view_stock':
        case 'view_logistics':
        case 'view_purchase_requests':
        case 'view_purchase_orders':
          return modules.inventory?.view;
        case 'create_products':
        case 'create_purchase_requests':
        case 'create_purchase_orders':
          return modules.inventory?.create;
        case 'edit_products':
        case 'edit_stock':
        case 'edit_logistics':
          return modules.inventory?.edit;
        case 'approve_purchase_requests':
          return modules.inventory?.approve;
          
        // Sales
        case 'view_sales':
        case 'view_customers':
          return modules.sales?.view;
        case 'edit_sales':
        case 'edit_customers':
          return modules.sales?.edit;
        case 'approve_sales':
          return modules.sales?.approve;
          
        // Finance
        case 'view_financials':
        case 'view_fiscal':
        case 'view_cost_price':
          return modules.finance?.view;
        case 'edit_financials':
        case 'edit_fiscal':
          return modules.finance?.edit;
          
        // Technical
        case 'view_service_orders':
          return modules.technical?.view;
        case 'edit_service_orders':
          return modules.technical?.edit;
          
        // Reports
        case 'view_reports':
        case 'view_audit':
          return modules.reports?.view;
          
        // Settings & Documents
        case 'view_settings':
        case 'view_documents':
          return modules.settings?.view;
        case 'manage_users':
        case 'manage_templates':
        case 'edit_documents':
          return modules.settings?.edit;
        case 'approve_documents':
          return modules.settings?.approve;
          
        // Dashboard
        case 'view_dashboard':
          return true;
          
        default:
          // Fallback for unmapped permissions
          break;
      }
    }

    const userRole = user.role as Role;
    return permissions[userRole]?.includes(permission) || false;
  };

  return { can, role: user?.role as Role };
}
