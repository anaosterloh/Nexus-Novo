import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Globe, 
  FileText, 
  DollarSign, 
  Calculator,
  Info,
  Truck,
  ShieldCheck
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const itemSchema = z.object({
  productId: z.string().min(1, 'Selecione um produto'),
  quantity: z.number().min(1, 'Qtd deve ser > 0'),
  unitPrice: z.number().min(0),
  taxIcms: z.number().optional(),
  taxIpi: z.number().optional(),
  taxPis: z.number().optional(),
  taxCofins: z.number().optional(),
  // International specific taxes
  taxIi: z.number().optional(), // Imposto de Importação
  taxAfrmm: z.number().optional(), // Adicional ao Frete para Renovação da Marinha Mercante
});

const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Selecione um fornecedor'),
  type: z.enum(['national', 'international']),
  status: z.string().min(1, 'Status é obrigatório'),
  items: z.array(itemSchema).min(1, 'Adicione pelo menos um item'),
  // International Documentation
  liNumber: z.string().optional(), // Licença de Importação
  diNumber: z.string().optional(), // Declaração de Importação
  invoiceNumber: z.string().optional(),
  incoterm: z.string().optional(), // EXW, FOB, CIF, etc.
  currency: z.string().min(1, 'Moeda é obrigatória'),
  exchangeRate: z.number().min(0),
  freightValue: z.number().min(0),
  insuranceValue: z.number().min(0),
  otherCosts: z.number().min(0),
  observations: z.string().optional(),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  order?: any;
}

export function PurchaseOrderForm({ open, onOpenChange, onSuccess, order }: PurchaseOrderFormProps) {
  const { currentCompany } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: order || {
      supplierId: '',
      type: 'national',
      status: 'draft',
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
      currency: 'BRL',
      exchangeRate: 1,
      freightValue: 0,
      insuranceValue: 0,
      otherCosts: 0,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const purchaseType = form.watch('type');

  const calculateSubtotal = () => {
    const items = form.watch('items') || [];
    return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const freight = form.watch('freightValue') || 0;
    const insurance = form.watch('insuranceValue') || 0;
    const others = form.watch('otherCosts') || 0;
    const exchangeRate = form.watch('exchangeRate') || 1;
    
    return (subtotal + freight + insurance + others) * exchangeRate;
  };

  const onSubmit = async (values: PurchaseOrderFormValues) => {
    if (!currentCompany) return;
    
    setIsSubmitting(true);
    try {
      const method = order ? 'PUT' : 'POST';
      const url = order ? `/api/purchase-orders/${order.id}` : '/api/purchase-orders';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          companyId: currentCompany.id,
          total_amount: calculateTotal(),
        }),
      });

      if (response.ok) {
        toast.success(order ? 'Pedido atualizado!' : 'Pedido de compra gerado!');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error('Erro ao salvar pedido');
      }
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-hidden flex flex-col p-0">
        <div className="p-6 border-b bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                <ShoppingBag className="h-6 w-6 text-emerald-600" />
                {order ? 'Editar Pedido de Compra' : 'Novo Pedido de Compra'}
              </DialogTitle>
              <div className="flex gap-2">
                <Badge variant={purchaseType === 'national' ? 'default' : 'outline'} className={cn(purchaseType === 'national' ? "bg-blue-600" : "border-blue-600 text-blue-600")}>
                  Nacional
                </Badge>
                <Badge variant={purchaseType === 'international' ? 'default' : 'outline'} className={cn(purchaseType === 'international' ? "bg-purple-600" : "border-purple-600 text-purple-600")}>
                  Internacional
                </Badge>
              </div>
            </div>
          </DialogHeader>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b bg-white dark:bg-zinc-950 shrink-0">
            <TabsList className="h-12 bg-transparent gap-6">
              <TabsTrigger value="geral" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Dados Gerais</TabsTrigger>
              <TabsTrigger value="itens" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Itens do Pedido</TabsTrigger>
              {purchaseType === 'international' && (
                <TabsTrigger value="importacao" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Importação / Aduaneiro</TabsTrigger>
              )}
              <TabsTrigger value="financeiro" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Custos & Totais</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <form id="purchase-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="geral" className="mt-0 space-y-6">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-4 space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Tipo de Compra</Label>
                    <Select onValueChange={(v) => form.setValue('type', v as any)} value={form.watch('type')}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="national">Mercado Nacional</SelectItem>
                        <SelectItem value="international">Importação (Internacional)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-8 space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Fornecedor {purchaseType === 'international' ? '(Internacional)' : ''}</Label>
                    <Select onValueChange={(v) => form.setValue('supplierId', v)} value={form.watch('supplierId')}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {purchaseType === 'national' ? (
                          <>
                            <SelectItem value="1">Distribuidora Nacional Peças Ltda</SelectItem>
                            <SelectItem value="2">Logística Brasil S.A.</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="3">Global Tech Solutions (USA)</SelectItem>
                            <SelectItem value="4">Shenzhen Electronics Co. (China)</SelectItem>
                            <SelectItem value="5">EuroParts GmbH (Germany)</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-12 space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Observações do Pedido</Label>
                    <Textarea {...form.register('observations')} placeholder="Instruções especiais para o fornecedor ou logística..." className="min-h-[100px]" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="itens" className="mt-0 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Produtos / Componentes</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/20 space-y-4">
                      <div className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-5 space-y-2">
                          <Label className="text-[9px] uppercase font-bold text-zinc-400">Produto</Label>
                          <Select onValueChange={(v) => form.setValue(`items.${index}.productId`, v)} value={form.watch(`items.${index}.productId`)}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Selecione o produto" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="p1">Placa Principal X-Ray</SelectItem>
                              <SelectItem value="p2">Sensor de Fluxo Industrial</SelectItem>
                              <SelectItem value="p3">Módulo de Potência 500W</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label className="text-[9px] uppercase font-bold text-zinc-400">Quantidade</Label>
                          <Input type="number" className="h-9" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} />
                        </div>
                        <div className="col-span-3 space-y-2">
                          <Label className="text-[9px] uppercase font-bold text-zinc-400">Preço Unit. ({form.watch('currency')})</Label>
                          <Input type="number" step="0.01" className="h-9" {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })} />
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-rose-500" onClick={() => remove(index)} disabled={fields.length === 1}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {purchaseType === 'international' && (
                        <div className="grid grid-cols-4 gap-4 pt-2 border-t border-dashed">
                          <div className="space-y-1">
                            <Label className="text-[8px] uppercase font-bold text-zinc-400">II (%)</Label>
                            <Input type="number" className="h-7 text-xs" {...form.register(`items.${index}.taxIi`, { valueAsNumber: true })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[8px] uppercase font-bold text-zinc-400">IPI-Imp (%)</Label>
                            <Input type="number" className="h-7 text-xs" {...form.register(`items.${index}.taxIpi`, { valueAsNumber: true })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[8px] uppercase font-bold text-zinc-400">PIS-Imp (%)</Label>
                            <Input type="number" className="h-7 text-xs" {...form.register(`items.${index}.taxPis`, { valueAsNumber: true })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[8px] uppercase font-bold text-zinc-400">COFINS-Imp (%)</Label>
                            <Input type="number" className="h-7 text-xs" {...form.register(`items.${index}.taxCofins`, { valueAsNumber: true })} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="importacao" className="mt-0 space-y-6">
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/20 flex items-start gap-3 mb-6">
                  <Globe className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-300">Gestão de Comércio Exterior</p>
                    <p className="text-xs text-purple-700 dark:text-purple-400">Preencha os dados aduaneiros para garantir a conformidade e o cálculo correto do custo de nacionalização.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Documentação
                    </h4>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-zinc-500">Licença de Importação (LI)</Label>
                      <Input {...form.register('liNumber')} placeholder="Ex: 23/0000000-0" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-zinc-500">Declaração de Importação (DI)</Label>
                      <Input {...form.register('diNumber')} placeholder="Ex: 23/0000000-0" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-zinc-500">Commercial Invoice</Label>
                      <Input {...form.register('invoiceNumber')} placeholder="Ex: INV-2023-001" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
                      <Truck className="h-4 w-4" /> Logística Internacional
                    </h4>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-zinc-500">Incoterm</Label>
                      <Select onValueChange={(v) => form.setValue('incoterm', v)} value={form.watch('incoterm')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                          <SelectItem value="FOB">FOB - Free On Board</SelectItem>
                          <SelectItem value="CIF">CIF - Cost, Insurance and Freight</SelectItem>
                          <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-zinc-500">Moeda</Label>
                        <Select onValueChange={(v) => form.setValue('currency', v)} value={form.watch('currency')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD - Dólar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="CNY">CNY - Yuan</SelectItem>
                            <SelectItem value="BRL">BRL - Real</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-zinc-500">Taxa de Câmbio</Label>
                        <Input type="number" step="0.0001" {...form.register('exchangeRate', { valueAsNumber: true })} />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financeiro" className="mt-0 space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 space-y-4">
                    <h4 className="text-xs font-bold uppercase text-zinc-500">Custos Adicionais</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-zinc-500">Valor do Frete ({form.watch('currency')})</Label>
                        <Input type="number" step="0.01" {...form.register('freightValue', { valueAsNumber: true })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-zinc-500">Valor do Seguro ({form.watch('currency')})</Label>
                        <Input type="number" step="0.01" {...form.register('insuranceValue', { valueAsNumber: true })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-zinc-500">Outras Despesas ({form.watch('currency')})</Label>
                        <Input type="number" step="0.01" {...form.register('otherCosts', { valueAsNumber: true })} />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-zinc-900 text-white space-y-6">
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-zinc-400">Subtotal ({form.watch('currency')})</p>
                      <p className="text-2xl font-bold">{calculateSubtotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <Separator className="bg-zinc-800" />
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-zinc-400">Total Convertido (R$)</p>
                      <p className="text-4xl font-black text-emerald-400">{calculateTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      <p className="text-[10px] text-zinc-500">Câmbio: {form.watch('exchangeRate')}</p>
                    </div>
                    <div className="pt-4">
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                        <Calculator className="h-3 w-3" />
                        Cálculo automático de impostos na confirmação
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </form>
          </div>
        </Tabs>

        <DialogFooter className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t shrink-0 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="purchase-form" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 px-8 h-10 font-bold">
            {isSubmitting ? 'Processando...' : 'Confirmar Pedido'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
