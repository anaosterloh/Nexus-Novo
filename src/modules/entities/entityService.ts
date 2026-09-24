import { Entity, EntityFormData, EntitySuggestion, EntityRole, ReviewEntityPayload, BlockEntityPayload } from './types';

// TODO: substituir comp_1 pelo companyId do contexto global quando o contexto multiempresa estiver consolidado.
const COMPANY_ID = 'comp_1';

export const entityService = {
  async getPendingReviewEntities(): Promise<Entity[]> {
    const res = await fetch(`/api/entities/pending-review?companyId=${COMPANY_ID}`);
    if (!res.ok) throw new Error('Failed to fetch pending review entities');
    return res.json();
  },

  async reviewEntity(id: string, data: ReviewEntityPayload): Promise<{ success: boolean }> {
    const session = localStorage.getItem('nexus_session_id');
    const res = await fetch(`/api/entities/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session}` },
      body: JSON.stringify({ ...data, companyId: COMPANY_ID }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (errData.error === 'PIN_REQUIRED') {
        throw { isPinRequired: true, actionKey: errData.actionKey, actionGroup: errData.actionGroup };
      }
      throw new Error(errData.error || 'Failed to review entity');
    }
    return res.json();
  },

  async blockEntity(id: string, data: BlockEntityPayload): Promise<{ success: boolean }> {
    const session = localStorage.getItem('nexus_session_id');
    const res = await fetch(`/api/entities/${id}/block`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session}` },
      body: JSON.stringify({ ...data, companyId: COMPANY_ID }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (errData.error === 'PIN_REQUIRED') {
        throw { isPinRequired: true, actionKey: errData.actionKey, actionGroup: errData.actionGroup };
      }
      throw new Error(errData.error || 'Failed to block/unblock entity');
    }
    return res.json();
  },

  async getEntities(role?: EntityRole, search?: string, status?: string): Promise<Entity[]> {
    const params = new URLSearchParams({ companyId: COMPANY_ID });
    if (role) {
      params.append('role', role);
    }
    if (search) {
      params.append('search', search);
    }
    if (status) {
      params.append('status', status);
    }

    const res = await fetch(`/api/entities?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch entities');
    return res.json();
  },

  async getEntity(id: string): Promise<Entity> {
    const res = await fetch(`/api/entities/${id}?companyId=${COMPANY_ID}`);
    if (!res.ok) throw new Error('Failed to fetch entity');
    return res.json();
  },

  async getSuggestions(q: string): Promise<EntitySuggestion[]> {
    if (q.length < 3) return [];
    
    const res = await fetch(`/api/entities/suggestions?companyId=${COMPANY_ID}&q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error('Failed to fetch suggestions');
    const data = await res.json();
    return data.suggestions || [];
  },

  async createEntity(data: Partial<EntityFormData>): Promise<{ success: boolean; id?: string; error?: string; entity?: Entity }> {
    const res = await fetch('/api/entities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, companyId: COMPANY_ID }),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      if (res.status === 409) {
        throw { isConflict: true, message: errorData.error, entity: errorData.entity };
      }
      throw new Error(errorData.error || 'Failed to create entity');
    }
    return res.json();
  },

  async updateEntity(id: string, data: Partial<EntityFormData>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/entities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) throw new Error('Failed to update entity');
    return res.json();
  },

  async updateEntityStatus(id: string, data: { status?: string; review_status?: string; documentation_status?: string; financial_status?: string; operational_status?: string }): Promise<{ success: boolean }> {
    const res = await fetch(`/api/entities/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) throw new Error('Failed to update entity status');
    return res.json();
  },

  async updateEntityRoles(id: string, roles: { is_customer?: number; is_supplier?: number; is_carrier?: number; is_manufacturer?: number; is_partner?: number; is_prospect?: number }): Promise<{ success: boolean }> {
    const res = await fetch(`/api/entities/${id}/roles`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roles),
    });
    
    if (!res.ok) throw new Error('Failed to update entity roles');
    return res.json();
  }
};
