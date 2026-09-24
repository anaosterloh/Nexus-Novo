import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { equipmentService } from './equipmentService';
import { Equipment } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface EquipmentFormProps {
  equipment?: Equipment | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EquipmentForm({ equipment, onSuccess, onCancel }: EquipmentFormProps) {
  const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm<Partial<Equipment>>({
    defaultValues: equipment || {
      ownership_type: 'customer',
      operational_status: 'active',
      name: '',
      brand: '',
      model: '',
      serial_number: '',
      patrimony: '',
      internal_code: '',
      equipment_type: '',
      informative_status: '',
      location_description: '',
      public_notes: '',
      internal_notes: '',
    }
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // NOTE: In a real app we'd fetch customers here, 
  // but we can just use a text input for customer_id for now or fetch from /api/customers 
  const [customers, setCustomers] = useState<any[]>([]);

  const fallbackCustomers = [
    { id: 'cust_1', name: 'João Silva' },
    { id: 'cust_2', name: 'Empresa ABC Ltda' },
    { id: 'cust_3', name: 'Maria Oliveira' },
    { id: 'cust_4', name: 'Tech Solutions SA' },
  ];

  useEffect(() => {
    // Basic fetch for customers to populate select
    fetch('/api/sales/customers?companyId=comp_1') // Hacky but works for the current backend standard
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCustomers(data);
        } else {
          setCustomers(fallbackCustomers);
        }
      })
      .catch(() => {
        setCustomers(fallbackCustomers);
      });
      
    if (equipment) {
      reset(equipment);
    }
  }, [equipment, reset]);

  const ownershipType = watch('ownership_type');

  const onSubmit = async (data: Partial<Equipment>) => {
    try {
      setLoading(true);
      setErrorMsg('');

      if (equipment?.id) {
        await equipmentService.updateEquipment(equipment.id, data);
      } else {
        await equipmentService.createEquipment(data);
      }
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar equipamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Posse *</Label>
          <Controller
            name="ownership_type"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">De Cliente</SelectItem>
                  <SelectItem value="company">Da Empresa</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {ownershipType === 'customer' && (
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Controller
              name="customer_id"
              control={control}
              rules={{ required: ownershipType === 'customer' }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.customer_id && <span className="text-xs text-red-500">Obrigatório para posse do cliente</span>}
          </div>
        )}

        <div className="space-y-2">
          <Label>Nome do Equipamento *</Label>
          <Input {...register('name', { required: true })} placeholder="Ex: Raio-X Digital" />
          {errors.name && <span className="text-xs text-red-500">Obrigatório</span>}
        </div>

        <div className="space-y-2">
          <Label>Tipo / Categoria</Label>
          <Input {...register('equipment_type')} placeholder="Ex: Imagem" />
        </div>

        <div className="space-y-2">
          <Label>Marca</Label>
          <Input {...register('brand')} placeholder="Ex: Siemens" />
        </div>

        <div className="space-y-2">
          <Label>Modelo</Label>
          <Input {...register('model')} placeholder="Ex: Somatom" />
        </div>

        <div className="space-y-2">
          <Label>Número de Série</Label>
          <Input {...register('serial_number')} placeholder="Ex: SN12345678" />
        </div>

        <div className="space-y-2">
          <Label>Patrimônio</Label>
          <Input {...register('patrimony')} placeholder="Ex: PAT-00123" />
        </div>

        <div className="space-y-2">
          <Label>Código Interno</Label>
          <Input {...register('internal_code')} placeholder="Ex: EQ-01" />
        </div>

        <div className="space-y-2">
          <Label>Status Operacional *</Label>
          <Controller
            name="operational_status"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="maintenance">Em Manutenção</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                  <SelectItem value="discarded">Descartado</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Localização / Setor</Label>
        <Input {...register('location_description')} placeholder="Ex: Sala de Raio-X 01" />
      </div>

      <div className="space-y-2">
        <Label>Status Informativo</Label>
        <Input {...register('informative_status')} placeholder="Ex: Aguardando peça" />
      </div>

      <div className="space-y-2">
        <Label>Observações Públicas</Label>
        <Textarea {...register('public_notes')} rows={3} placeholder="Visível em relatórios/laudos..." />
      </div>

      <div className="space-y-2">
        <Label>Observações Internas</Label>
        <Textarea {...register('internal_notes')} rows={3} placeholder="Apenas uso interno da equipe..." />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Salvar Equipamento
        </Button>
      </div>
    </form>
  );
}
