import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { QuickCreateSelect } from '@/components/ui/quick-create-select';
import { 
  Plus, 
  Calculator, 
  Trash2, 
  Calendar as CalendarIcon, 
  DollarSign, 
  FileText, 
  Link, 
  Paperclip,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';

const installmentSchema = z.object({
  date: z.string(),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
});

const costAllocationSchema = z.object({
  costCenterId: z.string().min(1, 'Selecione um centro de custo'),
  percentage: z.number().min(0.01).max(100),
});

const financeEntrySchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  totalAmount: z.number().min(0.01, 'Valor total deve ser maior que zero'),
  category: z.string().min(1, 'Selecione uma categoria'),
  bankAccountId: z.string().min(1, 'Selecione uma conta bancária'),
  entity: z.string().min(1, 'Selecione um cliente ou fornecedor'),
  documentNumber: z.string().optional(),
  accessKey: z.string().optional(),
  observations: z.string().optional(),
  additionalDocuments: z.array(z.object({
    name: z.string(),
    type: z.string(),
    url: z.string().optional()
  })).optional(),
  paymentMethod: z.string().min(1, 'Selecione a forma de pagamento'),
  frequency: z.enum(['none', 'weekly', 'monthly', 'quarterly', 'annual']),
  installmentsCount: z.number().min(1).max(120),
  installments: z.array(installmentSchema),
  costAllocations: z.array(costAllocationSchema).min(1, 'Adicione pelo menos um centro de custo'),
  startDate: z.string(),
});

type FinanceEntryFormValues = z.infer<typeof financeEntrySchema>;

interface FinanceEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function FinanceEntryForm({ open, onOpenChange, onSuccess }: FinanceEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');

  const form = useForm<FinanceEntryFormValues>({
    resolver: zodResolver(financeEntrySchema),
    defaultValues: {
      type: 'expense',
      description: '',
      totalAmount: 0,
      category: '',
      bankAccountId: '',
      entity: '',
      documentNumber: '',
      accessKey: '',
      observations: '',
      additionalDocuments: [],
      paymentMethod: 'boleto',
      frequency: 'none',
      installmentsCount: 1,
      installments: [],
      costAllocations: [{ costCenterId: '', percentage: 100 }],
      startDate: format(new Date(), 'yyyy-MM-dd'),
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "installments"
  });

  const { fields: allocationFields, append: appendAllocation, remove: removeAllocation } = useFieldArray({
    control: form.control,
    name: "costAllocations"
  });

  const { fields: docFields, append: appendDoc, remove: removeDoc } = useFieldArray({
    control: form.control,
    name: "additionalDocuments"
  });

  const calculateInstallments = () => {
    const totalAmount = form.getValues('totalAmount');
    const count = form.getValues('installmentsCount');
    const startDateStr = form.getValues('startDate');
    const frequency = form.getValues('frequency');
    
    if (!totalAmount || totalAmount <= 0) {
      toast.error('Informe o valor total para calcular as parcelas');
      return;
    }

    const startDate = new Date(startDateStr);
    const installmentAmount = Number((totalAmount / count).toFixed(2));
    const lastInstallmentAmount = Number((totalAmount - (installmentAmount * (count - 1))).toFixed(2));

    const newInstallments = [];
    for (let i = 0; i < count; i++) {
      let date = new Date(startDate);
      if (frequency === 'weekly') date = addWeeks(startDate, i);
      else if (frequency === 'monthly') date = addMonths(startDate, i);
      else if (frequency === 'quarterly') date = addMonths(startDate, i * 3);
      else if (frequency === 'annual') date = addYears(startDate, i);
      else if (i > 0) date = addMonths(startDate, i); // Default to monthly if count > 1 but frequency is none

      newInstallments.push({
        date: format(date, 'yyyy-MM-dd'),
        amount: i === count - 1 ? lastInstallmentAmount : installmentAmount
      });
    }

    replace(newInstallments);
    toast.success('Parcelas calculadas com sucesso!');
  };

  const onSubmit = async (values: FinanceEntryFormValues) => {
    const totalPercentage = values.costAllocations.reduce((acc, curr) => acc + curr.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      toast.error('A soma do rateio deve ser exatamente 100%');
      return;
    }

    setIsSubmitting(true);
    try {
      // Mock API call
      console.log('Submitting finance entry:', values);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Lançamento realizado com sucesso!');
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error('Erro ao realizar lançamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 bg-zinc-50 dark:bg-zinc-900/50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                <DollarSign className="h-6 w-6 text-emerald-600" />
                Lançamento Financeiro Avançado
              </DialogTitle>
              <DialogDescription>
                Controle de fluxo de caixa, rateio por centro de custo e anexos.
              </DialogDescription>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Módulo Financeiro 2.0
            </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b bg-white dark:bg-zinc-950">
            <TabsList className="h-12 bg-transparent gap-6">
              <TabsTrigger value="geral" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Dados Gerais</TabsTrigger>
              <TabsTrigger value="rateio" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Rateio de Custos</TabsTrigger>
              <TabsTrigger value="financeiro" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Parcelamento</TabsTrigger>
              <TabsTrigger value="anexos" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Anexos / Docs</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <form id="finance-form" onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6 pb-10">
              <TabsContent value="geral" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Tipo</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button"
                        variant={form.watch('type') === 'income' ? 'default' : 'outline'}
                        className={cn("flex-1 gap-2", form.watch('type') === 'income' ? "bg-emerald-600 hover:bg-emerald-700" : "")}
                        onClick={() => form.setValue('type', 'income')}
                      >
                        <ArrowUpCircle className="h-4 w-4" /> Receita
                      </Button>
                      <Button 
                        type="button"
                        variant={form.watch('type') === 'expense' ? 'default' : 'outline'}
                        className={cn("flex-1 gap-2", form.watch('type') === 'expense' ? "bg-rose-600 hover:bg-rose-700" : "")}
                        onClick={() => form.setValue('type', 'expense')}
                      >
                        <ArrowDownCircle className="h-4 w-4" /> Despesa
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Descrição / Histórico</Label>
                    <Input placeholder="Ex: Pagamento Fornecedor de Peças" {...form.register('description')} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Valor Total</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">R$</span>
                      <Input type="number" step="0.01" className="pl-10 h-10 font-bold" {...form.register('totalAmount', { valueAsNumber: true })} />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <QuickCreateSelect 
                      label={form.watch('type') === 'income' ? 'Cliente' : 'Fornecedor'}
                      placeholder="Selecione ou crie novo..."
                      options={[
                        { value: '1', label: 'Hospital Santa Maria' },
                        { value: '2', label: 'Distribuidora Global Peças' },
                        { value: '3', label: 'Tech Solutions Ltda' },
                      ]}
                      onSelect={(val) => form.setValue('entity', val)}
                      onCreate={(name) => toast.info(`Criando: ${name}`)}
                      value={form.watch('entity')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <QuickCreateSelect 
                    label="Categoria / Plano de Contas"
                    placeholder="Selecione a categoria..."
                    onCreate={(name) => toast.info(`Criando categoria: ${name}`)}
                    options={[
                      { value: 'vendas', label: 'Venda de Mercadorias' },
                      { value: 'servicos', label: 'Prestação de Serviços' },
                      { value: 'aluguel', label: 'Aluguel e Condomínio' },
                    ]}
                    onSelect={(val) => form.setValue('category', val)}
                    value={form.watch('category')}
                  />
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Conta Bancária / Caixa</Label>
                    <Select onValueChange={(v) => form.setValue('bankAccountId', v)} value={form.watch('bankAccountId')}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione a conta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="itau">Itaú Unibanco - Ag 1234</SelectItem>
                        <SelectItem value="nubank">Nubank PJ</SelectItem>
                        <SelectItem value="caixa">Caixa Interno (Dinheiro)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-dashed">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Nº Documento / NF</Label>
                    <Input placeholder="000.000" {...form.register('documentNumber')} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Chave de Acesso NF-e</Label>
                    <Input placeholder="44 dígitos da chave de acesso" {...form.register('accessKey')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-zinc-500">Observações Internas</Label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Detalhes adicionais sobre este lançamento..."
                    {...form.register('observations')}
                  />
                </div>
              </TabsContent>

              <TabsContent value="rateio" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Rateio por Centro de Custo</h3>
                    <p className="text-xs text-zinc-400">Distribua o valor deste lançamento entre diferentes setores.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendAllocation({ costCenterId: '', percentage: 0 })}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Centro
                  </Button>
                </div>

                <div className="space-y-3">
                  {allocationFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-zinc-50 p-3 rounded-lg border">
                      <div className="col-span-7 space-y-1">
                        <Label className="text-[9px] uppercase font-bold text-zinc-400">Centro de Custo</Label>
                        <Select onValueChange={(v) => form.setValue(`costAllocations.${index}.costCenterId`, v)} value={form.watch(`costAllocations.${index}.costCenterId`)}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sede">Sede Administrativa</SelectItem>
                            <SelectItem value="filial_sul">Filial Sul</SelectItem>
                            <SelectItem value="oficina">Oficina Técnica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-[9px] uppercase font-bold text-zinc-400">Porcentagem (%)</Label>
                        <Input type="number" step="0.01" className="h-9" {...form.register(`costAllocations.${index}.percentage`, { valueAsNumber: true })} />
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => removeAllocation(index)} disabled={allocationFields.length === 1}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4">
                  <div className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold",
                    Math.abs(allocationFields.reduce((acc, curr) => acc + (form.watch(`costAllocations.${allocationFields.indexOf(curr)}.percentage`) || 0), 0) - 100) < 0.01
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  )}>
                    Total do Rateio: {allocationFields.reduce((acc, curr) => acc + (form.watch(`costAllocations.${allocationFields.indexOf(curr)}.percentage`) || 0), 0).toFixed(2)}%
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financeiro" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Forma de Pagamento</Label>
                    <Select value={form.watch('paymentMethod')} onValueChange={(val) => form.setValue('paymentMethod', val)}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="boleto">Boleto Bancário</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Recorrência</Label>
                    <Select value={form.watch('frequency')} onValueChange={(val: any) => form.setValue('frequency', val)}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Único</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Vencimento Inicial</Label>
                    <Input type="date" className="h-10" {...form.register('startDate')} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Nº Parcelas</Label>
                    <div className="flex gap-2">
                      <Input type="number" min="1" className="h-10" {...form.register('installmentsCount', { valueAsNumber: true })} />
                      <Button type="button" size="icon" variant="secondary" className="h-10 w-10" onClick={calculateInstallments}>
                        <Calculator className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {fields.length > 0 && (
                  <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border">
                    <div className="space-y-2">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-2 rounded border shadow-sm">
                          <Badge variant="outline" className="h-6 w-12 justify-center">{index + 1}/{fields.length}</Badge>
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <Input type="date" className="h-8 text-xs" {...form.register(`installments.${index}.date` as const)} />
                            <Input type="number" step="0.01" className="h-8 text-xs font-bold" {...form.register(`installments.${index}.amount` as const, { valueAsNumber: true })} />
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="anexos" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Documentos e Comprovantes</h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendDoc({ name: '', type: 'Outros' })}>
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Documento
                    </Button>
                  </div>

                  {docFields.length > 0 && (
                    <div className="space-y-2">
                      {docFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-zinc-50 p-3 rounded-lg border">
                          <div className="col-span-6 space-y-1">
                            <Label className="text-[9px] uppercase font-bold text-zinc-400">Nome do Documento</Label>
                            <Input className="h-9" placeholder="Ex: Comprovante de Transferência" {...form.register(`additionalDocuments.${index}.name`)} />
                          </div>
                          <div className="col-span-4 space-y-1">
                            <Label className="text-[9px] uppercase font-bold text-zinc-400">Tipo</Label>
                            <Select onValueChange={(v) => form.setValue(`additionalDocuments.${index}.type`, v)} value={form.watch(`additionalDocuments.${index}.type`)}>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Comprovante">Comprovante</SelectItem>
                                <SelectItem value="Contrato">Contrato</SelectItem>
                                <SelectItem value="NF-e">NF-e / XML</SelectItem>
                                <SelectItem value="Outros">Outros</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2 flex justify-center">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => removeDoc(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-4 bg-zinc-50 dark:bg-zinc-900/20">
                    <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 dark:bg-emerald-900/30">
                      <Paperclip className="h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">Arraste seus arquivos aqui</h4>
                      <p className="text-sm text-zinc-500 max-w-xs mx-auto">Suporta PDF, JPG, PNG e XML de Notas Fiscais. Tamanho máximo 10MB.</p>
                    </div>
                    <Button type="button" variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" /> Selecionar Arquivos
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </form>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="p-6 border-t bg-zinc-50 dark:bg-zinc-900/50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form="finance-form" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 min-w-[150px]">
            {isSubmitting ? 'Processando...' : 'Confirmar Lançamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
