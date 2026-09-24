import React, { useState, useEffect } from 'react';
import { EntityFormData, EntityRole } from './types';
import { entityService } from './entityService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type EntityFormProps = {
  entityId: string | null;
  defaultRole?: EntityRole;
  onClose: () => void;
  onSave: () => void;
};

export const EntityForm: React.FC<EntityFormProps> = ({ entityId, defaultRole, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<EntityFormData>({
    legal_name: '',
    trade_name: '',
    display_name: '',
    document: '',
    email: '',
    phone: '',
    status: 'active',
    review_status: 'approved',
    documentation_status: 'not_checked',
    financial_status: 'clear',
    operational_status: 'allowed',
    roles: defaultRole ? [defaultRole] : [],
    quick_register: false,
    document_notes: '',
    internal_notes: ''
  });

  useEffect(() => {
    if (entityId) {
      loadEntity(entityId);
    }
  }, [entityId]);

  const loadEntity = async (id: string) => {
    setLoading(true);
    try {
      const entity = await entityService.getEntity(id);
      
      const roles: EntityRole[] = [];
      if (entity.is_customer) roles.push('customer');
      if (entity.is_supplier) roles.push('supplier');
      if (entity.is_carrier) roles.push('carrier');
      if (entity.is_manufacturer) roles.push('manufacturer');
      if (entity.is_partner) roles.push('partner');
      if (entity.is_prospect) roles.push('prospect');

      setFormData({
        legal_name: entity.legal_name || '',
        trade_name: entity.trade_name || '',
        display_name: entity.display_name,
        document: entity.document || '',
        email: entity.email || '',
        phone: entity.phone || '',
        status: entity.status,
        review_status: entity.review_status,
        documentation_status: entity.documentation_status,
        financial_status: entity.financial_status,
        operational_status: entity.operational_status,
        roles,
        quick_register: entity.quick_register === 1,
        document_notes: entity.document_notes || '',
        internal_notes: entity.internal_notes || ''
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof EntityFormData, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      
      // Auto-fill logic
      if (field === 'trade_name' && !prev.display_name && value) {
        next.display_name = value;
      }
      if (field === 'legal_name' && !prev.display_name && !next.trade_name && value) {
        next.display_name = value;
      }

      return next;
    });
  };

  const handleRoleToggle = (role: EntityRole) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role) 
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.display_name) {
      setError('O Nome de Exibição é obrigatório.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (entityId) {
        // Update general data
        await entityService.updateEntity(entityId, formData);
        // Roles and Status could be updated here ideally via separate calls or aggregated in the backend.
        // For simplicity, we are saving basic infos. Currently the PUT method in backend handles
        // general info. Let's fire patches for roles and status if needed. 
        await entityService.updateEntityRoles(entityId, {
          is_customer: formData.roles.includes('customer') ? 1 : 0,
          is_supplier: formData.roles.includes('supplier') ? 1 : 0,
          is_carrier: formData.roles.includes('carrier') ? 1 : 0,
          is_manufacturer: formData.roles.includes('manufacturer') ? 1 : 0,
          is_partner: formData.roles.includes('partner') ? 1 : 0,
          is_prospect: formData.roles.includes('prospect') ? 1 : 0,
        });

        await entityService.updateEntityStatus(entityId, {
          status: formData.status,
          review_status: formData.review_status,
          documentation_status: formData.documentation_status,
          financial_status: formData.financial_status,
          operational_status: formData.operational_status,
        });

      } else {
        await entityService.createEntity(formData);
      }
      onSave();
    } catch (err: any) {
      if (err.isConflict) {
        setError(`Duplicidade Encontrada: ${err.message}`);
        // Here we could show the conflicting entity from err.entity if we wanted.
      } else {
        setError(err.message || 'Erro ao salvar cadastro.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entityId ? 'Editar Cadastro' : 'Novo Cadastro Completo'}</DialogTitle>
          <DialogDescription>
            {entityId ? 'Atualize as informações do cadastro.' : 'Preencha os dados para criar um novo registro correspondente a esta entidade.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider">Identificação</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium">Nome de Exibição <span className="text-red-500">*</span></label>
                <Input required value={formData.display_name} onChange={e => handleChange('display_name', e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium">Documento (CPF/CNPJ)</label>
                <Input value={formData.document} onChange={e => handleChange('document', e.target.value)} placeholder="Apenas números ou formato padrão" />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium">Razão Social / Nome Completo</label>
                <Input value={formData.legal_name} onChange={e => handleChange('legal_name', e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium">Nome Fantasia / Apelido</label>
                <Input value={formData.trade_name} onChange={e => handleChange('trade_name', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider">Contatos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium">E-mail</label>
                <Input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium">Telefone</label>
                <Input value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider">Papéis (Quem é esta Entidade?)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['customer', 'supplier', 'carrier', 'manufacturer', 'partner', 'prospect'] as EntityRole[]).map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`role-${role}`} 
                    checked={formData.roles.includes(role)} 
                    onCheckedChange={() => handleRoleToggle(role)} 
                  />
                  <label htmlFor={`role-${role}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">
                    {role === 'customer' ? 'Cliente' :
                     role === 'supplier' ? 'Fornecedor' :
                     role === 'carrier' ? 'Transportadora' :
                     role === 'manufacturer' ? 'Fabricante' :
                     role === 'partner' ? 'Parceiro' : 'Prospect'}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider">Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status Geral</label>
                <Select value={formData.status} onValueChange={(val) => handleChange('status', val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="temporary">Temporário (Pré-cadastro)</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status de Revisão</label>
                <Select value={formData.review_status} onValueChange={(val) => handleChange('review_status', val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="pending_review">Pendente / Aguardando</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider">Observações</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações Internas (Uso geral)</label>
              <Input value={formData.internal_notes} onChange={e => handleChange('internal_notes', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações de Documentação</label>
              <Input value={formData.document_notes} onChange={e => handleChange('document_notes', e.target.value)} placeholder="Ex: Anexos recebidos fisicamente em..." />
              <p className="text-xs text-zinc-500">Nesta fase, registre nas observações onde o documento foi recebido. Upload real ficará para a fase de Documentação.</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>Salvar Cadastro</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
