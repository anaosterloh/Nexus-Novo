import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface OpportunityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (data: any) => void;
}

export function OpportunityForm({ open, onOpenChange, onSuccess }: OpportunityFormProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onSuccess({
        title: (e.target as any).title.value,
        company: (e.target as any).company.value,
        value: Number((e.target as any).value.value),
        priority: (e.target as any).priority.value,
        probability: 20, // Default start
        daysInStage: 0,
        lastActivity: 'Hoje'
      });
      onOpenChange(false);
      toast.success('Oportunidade criada com sucesso!');
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Oportunidade</DialogTitle>
          <DialogDescription>
            Cadastre um novo lead ou oportunidade comercial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Oportunidade</Label>
            <Input id="title" name="title" placeholder="Ex: Contrato de Manutenção Anual" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Cliente / Empresa</Label>
            <Input id="company" name="company" placeholder="Nome do cliente" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor Estimado (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                <Input id="value" name="value" type="number" className="pl-9" placeholder="0,00" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações Iniciais</Label>
            <Textarea id="notes" placeholder="Detalhes sobre a necessidade do cliente..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 gap-2" disabled={loading}>
              <CheckCircle2 className="h-4 w-4" />
              {loading ? 'Salvando...' : 'Criar Oportunidade'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
