export interface SystemParameter {
  key: string;
  company_id: string;
  value: string;
  category?: string;
  description?: string;
  updated_at?: string;
  updated_by?: string;
}

class SettingsService {
  async getParameters(companyId: string): Promise<SystemParameter[]> {
    const res = await fetch(`/api/settings/parameters?companyId=${companyId}`);
    if (!res.ok) throw new Error('Erro ao buscar parâmetros');
    return res.json();
  }

  async updateParameter(companyId: string, key: string, value: any, category?: string, userId?: string): Promise<void> {
    const res = await fetch('/api/settings/parameters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, key, value, category, userId })
    });
    if (!res.ok) throw new Error('Erro ao atualizar parâmetro');
  }

  async bulkUpdateParameters(companyId: string, parameters: { key: string; value: any; category?: string }[], userId?: string): Promise<void> {
    const res = await fetch('/api/settings/parameters/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, parameters, userId })
    });
    if (!res.ok) throw new Error('Erro ao atualizar parâmetros');
  }
}

export const settingsService = new SettingsService();
