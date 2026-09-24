import { Equipment, EquipmentFilter, EquipmentHistory } from './types';

const API_BASE_URL = '/api/equipments';
// TODO: substituir comp_1 pelo companyId do contexto global quando o contexto multiempresa estiver consolidado.
const DEFAULT_COMPANY_ID = 'comp_1';

export const equipmentService = {
  async getEquipments(filter: EquipmentFilter = {}): Promise<Equipment[]> {
    const params = new URLSearchParams();
    params.append('companyId', filter.companyId || DEFAULT_COMPANY_ID);
    
    if (filter.branchId) params.append('branchId', filter.branchId);
    if (filter.ownership) params.append('ownership', filter.ownership);
    if (filter.customerId) params.append('customerId', filter.customerId);
    if (filter.status) params.append('status', filter.status);
    if (filter.search) params.append('search', filter.search);
    if (filter.limit) params.append('limit', filter.limit.toString());
    if (filter.offset) params.append('offset', filter.offset.toString());

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to list equipments');
    }
    return response.json();
  },

  async getEquipmentsByCustomer(customerId: string, companyId: string = DEFAULT_COMPANY_ID): Promise<Equipment[]> {
    const response = await fetch(`${API_BASE_URL}/customer/${customerId}?companyId=${companyId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch customer equipments');
    }
    return response.json();
  },

  async getEquipment(id: string, companyId: string = DEFAULT_COMPANY_ID): Promise<Equipment> {
    const response = await fetch(`${API_BASE_URL}/${id}?companyId=${companyId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch equipment');
    }
    return response.json();
  },

  async getEquipmentHistory(id: string, companyId: string = DEFAULT_COMPANY_ID, months = 6): Promise<EquipmentHistory[]> {
    const response = await fetch(`${API_BASE_URL}/${id}/history?companyId=${companyId}&months=${months}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch equipment history');
    }
    return response.json();
  },

  async createEquipment(data: Partial<Equipment>): Promise<Equipment> {
    const payload = {
      ...data,
      company_id: data.company_id || DEFAULT_COMPANY_ID,
    };
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Throw friendly message if duplicate serial number
      if (response.status === 409) {
          throw new Error('Já existe um equipamento com este número de série neste contexto.');
      }
      throw new Error(errorData.error || 'Failed to create equipment');
    }
    return response.json();
  },

  async updateEquipment(id: string, data: Partial<Equipment>): Promise<Equipment> {
    const payload = {
      ...data,
      company_id: data.company_id || DEFAULT_COMPANY_ID,
    };

    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 409) {
        throw new Error('Já existe um equipamento com este número de série neste contexto.');
      }
      throw new Error(errorData.error || 'Failed to update equipment');
    }
    return response.json();
  },

  async changeStatus(id: string, status: string, companyId: string = DEFAULT_COMPANY_ID): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId, operational_status: status }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to change equipment status');
    }
  }
};
