export interface CustomerLocation {
  id: string;
  company_id: string;
  customer_id: string;
  name: string;
  address_line?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  reference_note?: string;
  is_default: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  company_id: string;
  branch_id?: string;
  ownership_type: 'customer' | 'company';
  customer_id?: string;
  customer_location_id?: string;
  name: string;
  equipment_type?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  patrimony?: string;
  internal_code?: string;
  operational_status: 'active' | 'inactive' | 'maintenance' | 'blocked' | 'discarded';
  informative_status?: string;
  location_description?: string;
  public_notes?: string;
  internal_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EquipmentHistory {
  id: string;
  company_id: string;
  equipment_id: string;
  action: string;
  description?: string;
  created_by?: string;
  created_at: string;
}

export interface EquipmentFilter {
  companyId?: string;
  branchId?: string;
  ownership?: 'customer' | 'company' | '';
  customerId?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}
