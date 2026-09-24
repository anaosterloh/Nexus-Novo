export type Role = 'admin' | 'manager' | 'sales' | 'tech' | 'stock' | 'finance';

export type Permission = 
  | 'view_dashboard'
  | 'view_financials'
  | 'edit_financials'
  | 'view_cost_price'
  | 'edit_products'
  | 'create_products'
  | 'view_products'
  | 'view_stock'
  | 'edit_stock'
  | 'view_customers'
  | 'edit_customers'
  | 'view_sales'
  | 'edit_sales'
  | 'approve_sales'
  | 'view_service_orders'
  | 'edit_service_orders'
  | 'view_reports'
  | 'manage_users'
  | 'view_logistics'
  | 'edit_logistics'
  | 'view_fiscal'
  | 'edit_fiscal'
  | 'view_audit'
  | 'view_purchase_requests'
  | 'create_purchase_requests'
  | 'approve_purchase_requests'
  | 'view_purchase_orders'
  | 'create_purchase_orders'
  | 'view_settings'
  | 'view_documents'
  | 'edit_documents'
  | 'approve_documents'
  | 'manage_templates';

export const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    'view_dashboard', 'view_financials', 'edit_financials', 'view_cost_price', 
    'edit_products', 'create_products', 'view_products', 'view_stock', 'edit_stock', 'view_customers', 'edit_customers', 'view_sales', 
    'edit_sales', 'approve_sales', 'view_service_orders', 'edit_service_orders', 
    'view_reports', 'manage_users', 'view_logistics', 'edit_logistics', 'view_fiscal', 'edit_fiscal', 'view_audit',
    'view_purchase_requests', 'create_purchase_requests', 'approve_purchase_requests', 'view_purchase_orders', 'create_purchase_orders', 'view_settings',
    'view_documents', 'edit_documents', 'approve_documents', 'manage_templates'
  ],
  manager: [
    'view_dashboard', 'view_financials', 'view_cost_price', 'edit_products', 'create_products', 'view_products', 'view_stock', 'edit_stock',
    'view_customers', 'edit_customers', 'view_sales', 'edit_sales', 
    'approve_sales', 'view_service_orders', 'view_reports', 'view_logistics', 'edit_logistics', 'view_fiscal',
    'view_purchase_requests', 'create_purchase_requests', 'approve_purchase_requests', 'view_purchase_orders', 'create_purchase_orders',
    'view_documents', 'edit_documents', 'approve_documents', 'manage_templates'
  ],
  sales: [
    'view_dashboard', 'view_customers', 'edit_customers', 'view_sales', 
    'edit_sales', 'view_stock', 'view_products', 'view_logistics',
    'view_documents', 'edit_documents'
  ],
  tech: [
    'view_dashboard', 'view_customers', 'view_service_orders', 'edit_service_orders', 'view_stock', 'view_products',
    'view_documents', 'edit_documents'
  ],
  stock: [
    'view_dashboard', 'edit_products', 'create_products', 'view_products', 'view_stock', 'edit_stock', 'view_logistics', 'edit_logistics',
    'view_purchase_requests', 'create_purchase_requests', 'view_purchase_orders'
  ],
  finance: [
    'view_dashboard', 'view_financials', 'edit_financials', 'view_sales', 
    'view_reports', 'view_fiscal', 'edit_fiscal', 'view_products', 'view_purchase_orders',
    'view_documents'
  ]
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}
