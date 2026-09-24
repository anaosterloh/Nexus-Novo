import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
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
import { useApp } from '@/context/AppContext';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

const requestSchema = z.object({
  itemId: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantidade inválida'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  reason: z.string().min(3, 'Informe o motivo da solicitação'),
});

type RequestFormValues = z.infer<typeof requestSchema>;

interface PurchaseRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialProduct?: string;
}

export function PurchaseRequestForm({ open, onOpenChange, onSuccess, initialProduct }: PurchaseRequestFormProps) {
  const { currentCompany, currentBranch } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      quantity: 1,
      priority: 'normal',
      reason: initialProduct ? `Solicitação de compra para item não cadastrado: ${initialProduct}` : '',
    }
  });

  useEffect(() => {
    if (initialProduct) {
      form.setValue('reason', `Solicitação de compra para item não cadastrado: ${initialProduct}`);
    }
  }, [initialProduct, form]);

  useEffect(() => {
    if (open && currentCompany) {
      fetch(`/api/inventory/items?companyId=${currentCompany.id}`)
        .then(res => res.json())
        .then(setProducts);
    }
  }, [open, currentCompany]);

  const onSubmit = async (values: RequestFormValues) => {
    if (!currentCompany || !currentBranch) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          companyId: currentCompany.id,
          branchId: currentBranch.id,
        }),
      });

      if (response.ok) {
        toast.success('Solicitação enviada com sucesso!');
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        toast.error('Erro ao enviar solicitação');
      }
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-emerald-600" />
            Nova Solicitação de Compra
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Produto</Label>
            <Select onValueChange={(v) => form.setValue('itemId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.description} ({p.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.itemId && <p className="text-xs text-red-500">{form.formState.errors.itemId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" step="0.01" {...form.register('quantity', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select onValueChange={(v: any) => form.setValue('priority', v)} defaultValue="normal">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Motivo / Justificativa</Label>
            <Textarea placeholder="Ex: Reposição de estoque, pedido de cliente..." {...form.register('reason')} />
            {form.formState.errors.reason && <p className="text-xs text-red-500">{form.formState.errors.reason.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
