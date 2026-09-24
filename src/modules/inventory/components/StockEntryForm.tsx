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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Truck, 
  Package, 
  Calculator,
  Receipt,
  Info,
  Search,
  Save
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const stockEntrySchema = z.object({
  nfeNumber: z.string().min(1, 'Número da NF-e é obrigatório'),
  nfeSeries: z.string().optional(),
  accessKey: z.string().length(44, 'Chave de acesso deve ter 44 dígitos').optional().or(z.literal('')),
  issueDate: z.string().min(1, 'Data de emissão é obrigatória'),
  entryDate: z.string().min(1, 'Data de entrada é obrigatória'),
  supplierId: z.string().min(1, 'Fornecedor é obrigatório'),
  operationType: z.string().min(1, 'Tipo de operação é obrigatório'),
  
  // Fiscal Info
  cfop: z.string().optional(),
  icmsValue: z.string().optional(),
  ipiValue: z.string().optional(),
  totalValue: z.string().min(1, 'Valor total é obrigatório'),
  freightValue: z.string().optional(),
  insuranceValue: z.string().optional(),
  otherCosts: z.string().optional(),
  
  items: z.array(z.object({
    productId: z.string().min(1, 'Produto é obrigatório'),
    quantity: z.number().min(0.01, 'Quantidade deve ser maior que zero'),
    unitPrice: z.number().min(0, 'Preço unitário não pode ser negativo'),
    totalPrice: z.number(),
    batch: z.string().optional(),
    expiryDate: z.string().optional(),
    ncm: z.string().optional(),
    cst: z.string().optional(),
  })).min(1, 'Adicione pelo menos um item'),
  
  observations: z.string().optional(),
});

type StockEntryFormValues = z.infer<typeof stockEntrySchema>;

interface StockEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function StockEntryForm({ open, onOpenChange, onSuccess }: StockEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { can } = usePermissions();
  const [taxGuide, setTaxGuide] = useState('');

  useEffect(() => {
    const savedGuide = localStorage.getItem('nexus_tax_guide_entry');
    if (savedGuide) {
      setTaxGuide(savedGuide);
    } else {
      setTaxGuide(`GUIA DE PREENCHIMENTO TRIBUTÁRIO (ENTRADA)

1. EMPRESAS DO SIMPLES NACIONAL:
   - CFOP: Utilizar 1.102 para compra de mercadoria para revenda.
   - CSOSN: Verificar se o fornecedor destacou o crédito de ICMS.
   - IPI: Não há crédito, o valor compõe o custo.

2. EMPRESAS DO REGIME NORMAL (LUCRO REAL/PRESUMIDO):
   - CFOP: Utilizar 1.102 (dentro do estado) ou 2.102 (fora do estado).
   - CST: 00 (Tributada integralmente) ou 20 (Com redução de base).
   - ICMS: Lançar o valor destacado na nota para crédito.
   - PIS/COFINS: Lançar crédito se regime não-cumulativo (Lucro Real).

3. SUBSTITUIÇÃO TRIBUTÁRIA:
   - CFOP: 1.403 ou 2.403.
   - ICMS ST: O valor pago antecipadamente compõe o custo da mercadoria.

OBSERVAÇÕES GERAIS:
- Sempre conferir a chave de acesso da NF-e no portal da SEFAZ.
- Divergências de valor superior a R$ 0,10 devem ser justificadas.`);
    }
  }, []);

  const handleSaveGuide = () => {
    localStorage.setItem('nexus_tax_guide_entry', taxGuide);
    toast.success('Guia tributário atualizado com sucesso!');
  };

  const form = useForm<StockEntryFormValues>({
    resolver: zodResolver(stockEntrySchema),
    defaultValues: {
      nfeNumber: '',
      nfeSeries: '1',
      issueDate: new Date().toISOString().split('T')[0],
      entryDate: new Date().toISOString().split('T')[0],
      operationType: 'compra',
      totalValue: '0.00',
      items: [{ productId: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const onSubmit = async (data: StockEntryFormValues) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Entrada de estoque registrada com sucesso!');
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error('Erro ao registrar entrada');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Receipt className="h-6 w-6 text-blue-600" />
            Entrada de Mercadoria / NF-e
          </DialogTitle>
          <DialogDescription>
            Registre a entrada de produtos no estoque com detalhes fiscais e financeiros.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="entry" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b">
            <TabsList className="w-full justify-start bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="entry" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-2"
              >
                Dados da Nota
              </TabsTrigger>
              {can('view_fiscal') && (
                <TabsTrigger 
                  value="guide" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-2"
                >
                  Guia Tributário
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="entry" className="flex-1 overflow-hidden m-0 p-0 flex flex-col">
            <ScrollArea className="flex-1 px-6 py-4">
              <form id="stock-entry-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="accessKey">Chave de Acesso (44 dígitos)</Label>
                    <div className="flex gap-2">
                      <Input id="accessKey" placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000" {...form.register('accessKey')} />
                      <Button type="button" variant="outline" size="icon" title="Consultar SEFAZ">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nfeNumber">Número NF-e</Label>
                    <Input id="nfeNumber" placeholder="000.000" {...form.register('nfeNumber')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nfeSeries">Série</Label>
                    <Input id="nfeSeries" placeholder="1" {...form.register('nfeSeries')} />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="supplierId">Fornecedor</Label>
                    <Select onValueChange={(v) => form.setValue('supplierId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Eletrônica Global S/A</SelectItem>
                        <SelectItem value="2">Metalúrgica São José</SelectItem>
                        <SelectItem value="3">Nexus Importadora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Data Emissão</Label>
                    <Input id="issueDate" type="date" {...form.register('issueDate')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entryDate">Data Entrada</Label>
                    <Input id="entryDate" type="date" {...form.register('entryDate')} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                      <Package className="h-4 w-4" /> Itens da Nota
                    </h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, totalPrice: 0 })}
                    >
                      <Plus className="h-4 w-4" /> Adicionar Item
                    </Button>
                  </div>

                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-100 dark:bg-zinc-800 border-b">
                        <tr>
                          <th className="p-2 text-left w-[300px]">Produto</th>
                          <th className="p-2 text-center w-[100px]">Qtd</th>
                          <th className="p-2 text-right w-[120px]">V. Unitário</th>
                          <th className="p-2 text-right w-[120px]">V. Total</th>
                          <th className="p-2 text-left w-[150px]">Lote / Validade</th>
                          <th className="p-2 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {fields.map((field, index) => (
                          <tr key={field.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                            <td className="p-2">
                              <Select onValueChange={(v) => form.setValue(`items.${index}.productId`, v)}>
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Selecione o produto" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="p1">Válvula Hidráulica V-200</SelectItem>
                                  <SelectItem value="p2">Sensor de Pressão S-10</SelectItem>
                                  <SelectItem value="p3">Filtro de Óleo F-50</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2">
                              <Input 
                                type="number" 
                                step="0.01" 
                                className="h-8 text-center text-xs" 
                                {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} 
                              />
                            </td>
                            <td className="p-2">
                              <Input 
                                type="number" 
                                step="0.01" 
                                className="h-8 text-right text-xs" 
                                {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })} 
                              />
                            </td>
                            <td className="p-2 text-right font-mono text-xs">
                              R$ {(form.watch(`items.${index}.quantity`) * form.watch(`items.${index}.unitPrice`)).toFixed(2)}
                            </td>
                            <td className="p-2">
                              <div className="flex gap-1">
                                <Input placeholder="Lote" className="h-8 text-xs" {...form.register(`items.${index}.batch`)} />
                                <Input type="date" className="h-8 text-xs" {...form.register(`items.${index}.expiryDate`)} />
                              </div>
                            </td>
                            <td className="p-2 text-center">
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-rose-500"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div className="p-4 border rounded-xl space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                        <Calculator className="h-4 w-4" /> Informações Fiscais
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">CFOP Padrão</Label>
                          <Input placeholder="5.102" {...form.register('cfop')} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Base de Cálculo ICMS</Label>
                          <Input placeholder="0,00" {...form.register('icmsValue')} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Valor IPI</Label>
                          <Input placeholder="0,00" {...form.register('ipiValue')} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Outras Despesas</Label>
                          <Input placeholder="0,00" {...form.register('otherCosts')} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="observations">Observações da Nota</Label>
                      <Textarea id="observations" placeholder="Observações internas ou da NF-e..." {...form.register('observations')} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Resumo Financeiro</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Subtotal Itens:</span>
                          <span className="font-mono">R$ 0,00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Frete:</span>
                          <div className="w-24">
                            <Input className="h-6 text-right text-xs" {...form.register('freightValue')} />
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Seguro:</span>
                          <div className="w-24">
                            <Input className="h-6 text-right text-xs" {...form.register('insuranceValue')} />
                          </div>
                        </div>
                        <div className="pt-2 border-t flex justify-between items-center">
                          <span className="font-bold">TOTAL DA NOTA:</span>
                          <div className="w-32">
                            <Input className="h-8 text-right font-bold text-blue-600" {...form.register('totalValue')} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="generatePayable" className="rounded border-zinc-300" defaultChecked />
                          <Label htmlFor="generatePayable" className="text-xs">Gerar Contas a Pagar automaticamente</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="updateCosts" className="rounded border-zinc-300" defaultChecked />
                          <Label htmlFor="updateCosts" className="text-xs">Atualizar custo médio dos produtos</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-blue-100 bg-blue-50/30 rounded-xl flex gap-3">
                      <Info className="h-5 w-5 text-blue-600 shrink-0" />
                      <p className="text-[10px] text-blue-700 leading-relaxed">
                        Ao finalizar esta entrada, o saldo de estoque dos itens será atualizado imediatamente e um registro de movimentação será criado.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </ScrollArea>
            <DialogFooter className="p-6 border-t bg-zinc-50 dark:bg-zinc-900/50">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                form="stock-entry-form" 
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 min-w-[150px]"
              >
                {isSubmitting ? 'Processando...' : 'Finalizar Entrada'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="guide" className="flex-1 overflow-hidden m-0 p-6 flex flex-col">
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-500" />
                    Guia de Preenchimento Tributário
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Instruções para o correto lançamento de notas fiscais de entrada.
                  </p>
                </div>
                {can('edit_fiscal') && (
                  <Button onClick={handleSaveGuide} size="sm" className="gap-2">
                    <Save className="h-4 w-4" /> Salvar Guia
                  </Button>
                )}
              </div>

              <div className="flex-1 border rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900">
                {can('edit_fiscal') ? (
                  <Textarea 
                    value={taxGuide}
                    onChange={(e) => setTaxGuide(e.target.value)}
                    className="w-full h-full p-4 resize-none border-0 focus-visible:ring-0 bg-transparent font-mono text-sm"
                    placeholder="Digite as instruções aqui..."
                  />
                ) : (
                  <div className="w-full h-full p-4 overflow-auto whitespace-pre-wrap font-mono text-sm">
                    {taxGuide}
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex gap-3 items-start">
                <Info className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1">Importante:</p>
                  <p>As informações contidas neste guia são de responsabilidade do departamento fiscal. Mantenha este guia sempre atualizado conforme a legislação vigente (ICMS, IPI, PIS/COFINS).</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
