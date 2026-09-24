import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
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
import { Trash2, Plus, Package, User, DollarSign, Truck, Calendar, CreditCard, Info, ShoppingBag } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SmartCombobox } from '@/components/ui/SmartCombobox';
import { usePermissions } from '@/hooks/usePermissions';
import { ProductForm } from '@/modules/inventory/components/ProductForm';
import { PurchaseRequestForm } from '@/modules/inventory/components/PurchaseRequestForm';

const orderSchema = z.object({
  orderNumber: z.string().min(1, 'Número do pedido é obrigatório'),
  customerId: z.string().min(1, 'Selecione um cliente'),
  sellerId: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentTerms: z.string().optional(),
  transporterId: z.string().optional(),
  freightType: z.enum(['CIF', 'FOB', 'CIF_FOB_50']),
  freightValue: z.number(),
  discount: z.number(),
  addition: z.number(),
  notes: z.string().optional(),
  invoiceKeys: z.array(z.string()).optional(),
  items: z.array(z.object({
    itemId: z.string().min(1, 'Selecione um produto'),
    quantity: z.number().min(0.01, 'Mínimo 0.01'),
    unitPrice: z.number().min(0, 'Preço inválido'),
    discount: z.number(),
    taxIcms: z.number().optional(),
    taxIpi: z.number().optional(),
    taxIss: z.number().optional(),
  })).min(1, 'Adicione pelo menos um item'),
  installments: z.array(z.object({
    dueDate: z.string(),
    amount: z.number(),
    method: z.string(),
  })).optional(),
  expeditionItems: z.array(z.object({
    itemId: z.string().min(1, 'Selecione um item'),
    quantity: z.number().min(0.01, 'Mínimo 0.01'),
    type: z.enum(['embalagem', 'etiqueta', 'acessorio', 'outro']),
    notes: z.string().optional(),
  })).optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface SalesOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SalesOrderForm({ open, onOpenChange, onSuccess }: SalesOrderFormProps) {
  const { currentCompany, currentBranch } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('geral');
  const { can } = usePermissions();

  const [productFormOpen, setProductFormOpen] = useState(false);
  const [purchaseRequestFormOpen, setPurchaseRequestFormOpen] = useState(false);
  const [pendingSearch, setPendingSearch] = useState('');

  const handleProductCreate = (searchValue: string) => {
    setPendingSearch(searchValue);
    if (can('create_products')) {
      setProductFormOpen(true);
    } else {
      setPurchaseRequestFormOpen(true);
    }
  };

  const handleProductSuccess = () => {
    // Refresh products list
    if (currentCompany) {
      fetch(`/api/inventory/items?companyId=${currentCompany.id}`)
        .then(res => res.json())
        .then(setProducts);
    }
  };

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      orderNumber: `PED-${Math.floor(1000 + Math.random() * 9000)}`,
      items: [{ itemId: '', quantity: 1, unitPrice: 0, discount: 0, taxIcms: 0, taxIpi: 0, taxIss: 0 }],
      freightType: 'CIF',
      freightValue: 0,
      discount: 0,
      addition: 0,
      invoiceKeys: [''],
      installments: [],
      expeditionItems: [],
    }
  });

  // Mock permission check
  const isFinance = false; // In a real app, this would come from auth context

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerAlert, setCustomerAlert] = useState<string | null>(null);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const { fields: installmentFields, append: appendInstallment, remove: removeInstallment, replace: replaceInstallments } = useFieldArray({
    control: form.control,
    name: "installments"
  });

  const { fields: expeditionFields, append: appendExpedition, remove: removeExpedition } = useFieldArray({
    control: form.control,
    name: "expeditionItems"
  });

  useEffect(() => {
    if (open && currentCompany) {
      // Fetch customers
      fetch(`/api/sales/customers?companyId=${currentCompany.id}`)
        .then(res => res.json())
        .then(setCustomers);
      
      // Fetch products
      fetch(`/api/inventory/items?companyId=${currentCompany.id}`)
        .then(res => res.json())
        .then(setProducts);
    }
  }, [open, currentCompany]);

  const generateInstallments = () => {
    const total = calculateTotal();
    const terms = form.getValues('paymentTerms');
    const method = form.getValues('paymentMethod') || 'boleto';
    
    if (!terms) {
      toast.error('Selecione a condição de pagamento primeiro');
      return;
    }

    let count = 1;
    let days = [0];

    if (terms === '30') { count = 1; days = [30]; }
    else if (terms === '30/60') { count = 2; days = [30, 60]; }
    else if (terms === '30/60/90') { count = 3; days = [30, 60, 90]; }
    else if (terms === 'vista') { count = 1; days = [0]; }

    const installmentAmount = total / count;
    const newInstallments = days.map(d => {
      const date = new Date();
      date.setDate(date.getDate() + d);
      return {
        dueDate: date.toISOString().split('T')[0],
        amount: Number(installmentAmount.toFixed(2)),
        method
      };
    });

    replaceInstallments(newInstallments);
    toast.success(`${count} parcelas geradas automaticamente.`);
  };

  const onSubmit = async (values: OrderFormValues) => {
    if (!currentBranch || !currentCompany) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/sales/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          branchId: currentBranch.id,
          companyId: currentCompany.id,
        }),
      });

      if (response.ok) {
        toast.success('Pedido criado com sucesso!');
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        toast.error('Erro ao criar pedido');
      }
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateSubtotal = () => {
    const items = form.watch('items') || [];
    return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  };

  const calculateTaxes = () => {
    const items = form.watch('items') || [];
    return items.reduce((acc, item) => {
      const icms = (item.taxIcms || 0) / 100 * (item.quantity * item.unitPrice);
      const ipi = (item.taxIpi || 0) / 100 * (item.quantity * item.unitPrice);
      const iss = (item.taxIss || 0) / 100 * (item.quantity * item.unitPrice);
      return acc + icms + ipi + iss;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const taxes = calculateTaxes();
    const discount = form.watch('discount') || 0;
    const addition = form.watch('addition') || 0;
    const freight = form.watch('freightValue') || 0;
    return subtotal + taxes - discount + addition + freight;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-y-auto p-0">
        <div className="p-6 border-b bg-zinc-50 dark:bg-zinc-900/50">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                <ShoppingBag className="h-6 w-6 text-emerald-600" />
                Pedido de Venda Profissional
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase tracking-widest text-[10px] px-3">
                  Novo Orçamento
                </Badge>
                <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200 uppercase tracking-widest text-[10px] px-3">
                  {currentBranch?.name}
                </Badge>
              </div>
            </div>
          </DialogHeader>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 border-b bg-white dark:bg-zinc-900 sticky top-0 z-10">
              <TabsList className="h-12 bg-transparent gap-6">
                <TabsTrigger value="geral" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Pedido e Itens</TabsTrigger>
                <TabsTrigger value="obs" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Observações</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="geral" className="mt-0 space-y-6">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6 space-y-2">
                    <Label htmlFor="orderNumber" className="text-[10px] uppercase font-bold text-zinc-500">Número do Pedido</Label>
                    <Input 
                      id="orderNumber" 
                      {...form.register('orderNumber')} 
                      className="h-10 font-mono font-bold text-blue-600"
                      readOnly
                    />
                  </div>
                  <div className="col-span-6 space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Data do Pedido</Label>
                    <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="h-10" readOnly />
                  </div>

                  <div className="col-span-12 space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center justify-between">
                      <span>Cliente</span>
                      {customers.length === 0 && (
                        <span className="text-[10px] text-rose-500 font-bold animate-pulse">Nenhum cliente cadastrado!</span>
                      )}
                    </Label>
                    <Select onValueChange={(v) => {
                      form.setValue('customerId', v);
                      const customer = customers.find(c => c.id === v);
                      setSelectedCustomer(customer);
                      
                      // Mock customer alerts
                      if (customer?.id === 'c1') {
                        setCustomerAlert('CLIENTE BLOQUEADO: Pendências financeiras em aberto.');
                      } else if (customer?.id === 'c2') {
                        setCustomerAlert('AVISO: Documentação de crédito vencida.');
                      } else {
                        setCustomerAlert(null);
                      }

                      // Pull customer notes into order notes
                      if (customer?.notes) {
                        form.setValue('notes', customer.notes);
                      }
                    }}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={customers.length === 0 ? "Cadastre um cliente primeiro" : "Selecione o cliente"} />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name} ({c.document})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {customerAlert && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 animate-in fade-in slide-in-from-top-2">
                    <Info className="h-5 w-5 shrink-0" />
                    <p className="text-xs font-bold uppercase tracking-tight">{customerAlert}</p>
                  </div>
                )}

                {selectedCustomer && (
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 dark:bg-emerald-900/50">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400">{selectedCustomer.name}</p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-500 uppercase font-medium">
                          CNPJ/CPF: {selectedCustomer.document} • Endereço: {selectedCustomer.address}, {selectedCustomer.number} - {selectedCustomer.city}/{selectedCustomer.state}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Produtos / Serviços</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => append({ itemId: '', quantity: 1, unitPrice: 0, discount: 0, taxIcms: 0, taxIpi: 0, taxIss: 0 })}
                    >
                      <Plus className="mr-2 h-3 w-3" /> Adicionar Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {fields.map((field, index) => {
                      const selectedProdId = form.watch(`items.${index}.itemId`);
                      const selectedProd = products.find(p => p.id === selectedProdId);
                      
                      return (
                        <div key={field.id} className="bg-zinc-50 p-4 rounded-lg border dark:bg-zinc-900/50 relative group">
                          <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-4 space-y-1">
                              <Label className="text-[9px] uppercase font-bold text-zinc-400">Produto</Label>
                              <SmartCombobox
                                items={products.map(p => ({ value: p.id, label: `${p.description} (${p.code})` }))}
                                value={selectedProdId}
                                onSelect={(v) => {
                                  form.setValue(`items.${index}.itemId`, v);
                                  const prod = products.find(p => p.id === v);
                                  if (prod) {
                                    form.setValue(`items.${index}.unitPrice`, prod.price || 0);
                                  }
                                }}
                                onCreate={handleProductCreate}
                                createMessage={can('create_products') ? "Cadastrar Novo Produto" : "Solicitar Compra"}
                                placeholder="Buscar produto..."
                                className="h-9"
                              />
                            </div>

                            <div className="col-span-4 space-y-1">
                              <Label className="text-[9px] uppercase font-bold text-zinc-400">Descrição</Label>
                              <Input 
                                value={selectedProd?.description || ''}
                                className="h-9 bg-zinc-100 dark:bg-zinc-800"
                                readOnly
                              />
                            </div>

                            <div className="col-span-1 space-y-1">
                              <Label className="text-[9px] uppercase font-bold text-zinc-400">Qtd.</Label>
                              <Input 
                                type="number" 
                                step="0.01" 
                                className={cn(
                                  "h-9",
                                  selectedProd && (selectedProd.total_quantity || 0) < (form.watch(`items.${index}.quantity`) || 0) && "border-rose-500 text-rose-600 focus-visible:ring-rose-500"
                                )}
                                {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} 
                              />
                              {selectedProd && (
                                <div className="flex justify-center">
                                  {(selectedProd.total_quantity || 0) >= (form.watch(`items.${index}.quantity`) || 0) ? (
                                    <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                      Disp.
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-rose-600 flex items-center gap-1">
                                      <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                      Indisp.
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="col-span-2 space-y-1">
                              <Label className="text-[9px] uppercase font-bold text-zinc-400">Vlr. Unit.</Label>
                              <Input 
                                type="number" 
                                step="0.01" 
                                className="h-9"
                                {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })} 
                              />
                            </div>

                            <div className="col-span-1 flex justify-center">
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-zinc-50 p-4 rounded-lg border dark:bg-zinc-900/50">
                    <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Subtotal de Itens</p>
                    <p className="text-lg font-bold">R$ {calculateSubtotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 dark:bg-emerald-900/20">
                    <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Total Geral</p>
                    <p className="text-lg font-bold text-emerald-700">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Desconto (R$)</Label>
                    <Input type="number" step="0.01" {...form.register('discount', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Acréscimo (R$)</Label>
                    <Input type="number" step="0.01" {...form.register('addition', { valueAsNumber: true })} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="obs" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-zinc-500">Observações do Pedido (Aparecerão na Impressão)</Label>
                  <Textarea 
                    placeholder="Instruções para o faturamento ou expedição..." 
                    className="min-h-[150px] resize-none"
                    {...form.register('notes')} 
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-lg border dark:bg-zinc-950">
                <p className="text-[10px] uppercase font-bold text-zinc-400 leading-none mb-1">Total do Pedido</p>
                <p className="text-2xl font-bold text-emerald-600 leading-none">
                  R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 px-10 h-12 text-base font-bold shadow-lg shadow-emerald-600/20">
                {isSubmitting ? 'Processando...' : 'Finalizar Pedido'}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>

      <ProductForm 
        open={productFormOpen} 
        onOpenChange={setProductFormOpen} 
        onSuccess={handleProductSuccess}
        initialDescription={pendingSearch}
      />

      <PurchaseRequestForm 
        open={purchaseRequestFormOpen} 
        onOpenChange={setPurchaseRequestFormOpen} 
        onSuccess={() => {}}
        initialProduct={pendingSearch}
      />
    </Dialog>
  );
}
