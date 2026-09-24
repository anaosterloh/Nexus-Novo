import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
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
import { Package, DollarSign, ShieldCheck, Warehouse, Info, BarChart3, Plus, Trash2, FileText, Save, Layers, Cpu, QrCode, Boxes } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const productSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category: z.string().min(1, 'Selecione uma categoria'),
  unit: z.string().min(1, 'Selecione a unidade'),
  status: z.enum(['active', 'inactive', 'discontinued']),
  item_type: z.enum(['sale', 'part', 'consumable']),
  tracks_batch: z.boolean(),
  tracks_serial: z.boolean(),
  tracks_expiry: z.boolean(),
  tracks_manufacturing_date: z.boolean(),
  is_composite: z.boolean(),
  costPrice: z.number().min(0, 'Preço de custo deve ser maior ou igual a 0'),
  sellingPrice: z.number().min(0, 'Preço de venda deve ser maior ou igual a 0'),
  minSellingPrice: z.number().min(0, 'Preço mínimo de venda deve ser maior ou igual a 0'),
  minStock: z.number().min(0),
  maxStock: z.number().min(0),
  validityAlertDays: z.number().min(0).optional(),
  location: z.string().optional(),
  ncm: z.string().optional(),
  cest: z.string().optional(),
  taxRegime: z.enum(['simples', 'presumido', 'real']).optional(),
  origin: z.string().optional(),
  cfop: z.string().optional(),
  icmsRate: z.number().optional(),
  ipiRate: z.number().optional(),
  pisRate: z.number().optional(),
  cofinsRate: z.number().optional(),
  issRate: z.number().optional(),
  observations: z.string().optional(),
  tax_notes: z.string().optional(),
  batches: z.array(z.object({
    id: z.string(),
    batchNumber: z.string(),
    quantity: z.number().optional(),
    manufacturingDate: z.string().optional(),
    expiryDate: z.string().optional(),
    status: z.enum(['active', 'blocked', 'expired', 'recalled']),
    observations: z.string().optional(),
    history: z.array(z.object({
      date: z.string(),
      action: z.string(),
      user: z.string(),
      notes: z.string().optional()
    })).optional()
  })).optional(),
  components: z.array(z.object({
    component_item_id: z.string(),
    name: z.string().optional(),
    code: z.string().optional(),
    quantity: z.number().min(0.0001, 'Quantidade inválida'),
    unit: z.string().optional(),
    cost: z.number().optional(),
    notes: z.string().optional()
  })).optional()
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  product?: any;
  initialDescription?: string;
}

import { usePermissions } from '@/hooks/usePermissions';

export function ProductForm({ open, onOpenChange, onSuccess, product, initialDescription }: ProductFormProps) {
  const { currentCompany } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { can } = usePermissions();
  const [taxGuide, setTaxGuide] = useState('');
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [compQty, setCompQty] = useState(1);

  useEffect(() => {
    const savedGuide = localStorage.getItem('nexus_product_tax_guide');
    if (savedGuide) {
      setTaxGuide(savedGuide);
    }
  }, []);

  // Carregar produtos disponíveis para vincular no BOM
  useEffect(() => {
    if (open && currentCompany) {
      fetch(`/api/inventory/items?companyId=${currentCompany.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAvailableProducts(data.filter(i => i.id !== product?.id));
          }
        })
        .catch(() => {});
    }
  }, [open, currentCompany, product?.id]);

  // Carregar composição (BOM) se editando item existente
  useEffect(() => {
    if (product?.id && open) {
      fetch(`/api/inventory/items/${product.id}/composition`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            form.setValue('components', data.map((c: any) => ({
              component_item_id: c.component_item_id,
              name: c.component_description,
              code: c.component_code,
              quantity: c.quantity,
              unit: c.component_unit || c.unit || 'UN',
              cost: c.cost_price || 0,
              notes: c.notes || ''
            })));
            form.setValue('is_composite', true);
          }
        })
        .catch(() => {});
    }
  }, [product?.id, open]);

  const saveTaxGuide = () => {
    localStorage.setItem('nexus_product_tax_guide', taxGuide);
    toast.success('Guia Tributário salvo com sucesso!');
  };

  const parseItemType = (type?: string): 'sale' | 'part' | 'consumable' => {
    if (type === 'part' || type === 'consumable' || type === 'sale') return type;
    if (type === 'raw_material') return 'consumable';
    return 'sale';
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      status: 'active',
      item_type: parseItemType(product.item_type),
      tracks_batch: Boolean(product.tracks_batch || product.item_type === 'batch'),
      tracks_serial: Boolean(product.tracks_serial || product.item_type === 'serial'),
      tracks_expiry: Boolean(product.tracks_expiry),
      tracks_manufacturing_date: Boolean(product.tracks_manufacturing_date),
      is_composite: Boolean(product.is_composite || product.item_type === 'kit'),
      costPrice: product.cost_price !== undefined ? product.cost_price : (product.costPrice || 0),
      sellingPrice: product.selling_price !== undefined ? product.selling_price : (product.sellingPrice || 0),
      minSellingPrice: product.min_selling_price !== undefined ? product.min_selling_price : (product.minSellingPrice || 0),
      minStock: product.min_stock !== undefined ? product.min_stock : (product.minStock || 0),
      maxStock: product.max_stock !== undefined ? product.max_stock : (product.maxStock || 0),
      location: product.physical_location || product.location || '',
      validityAlertDays: product.validity_alert_days !== undefined ? product.validity_alert_days : (product.validityAlertDays || 0),
      components: [],
      ...product
    } : {
      code: '',
      description: initialDescription || '',
      category: '',
      unit: 'UN',
      status: 'active',
      item_type: 'sale',
      tracks_batch: false,
      tracks_serial: false,
      tracks_expiry: false,
      tracks_manufacturing_date: false,
      is_composite: false,
      costPrice: 0,
      sellingPrice: 0,
      minSellingPrice: 0,
      minStock: 0,
      maxStock: 0,
      location: '',
      validityAlertDays: 0,
      ncm: '',
      cest: '',
      icmsRate: 18,
      ipiRate: 0,
      batches: [],
      components: []
    }
  });

  useEffect(() => {
    if (product) {
      form.reset({
        status: 'active',
        item_type: parseItemType(product.item_type),
        tracks_batch: Boolean(product.tracks_batch || product.item_type === 'batch'),
        tracks_serial: Boolean(product.tracks_serial || product.item_type === 'serial'),
        tracks_expiry: Boolean(product.tracks_expiry),
        tracks_manufacturing_date: Boolean(product.tracks_manufacturing_date),
        is_composite: Boolean(product.is_composite || product.item_type === 'kit'),
        costPrice: product.cost_price !== undefined ? product.cost_price : (product.costPrice || 0),
        sellingPrice: product.selling_price !== undefined ? product.selling_price : (product.sellingPrice || 0),
        minSellingPrice: product.min_selling_price !== undefined ? product.min_selling_price : (product.minSellingPrice || 0),
        minStock: product.min_stock !== undefined ? product.min_stock : (product.minStock || 0),
        maxStock: product.max_stock !== undefined ? product.max_stock : (product.maxStock || 0),
        location: product.physical_location || product.location || '',
        validityAlertDays: product.validity_alert_days !== undefined ? product.validity_alert_days : (product.validityAlertDays || 0),
        components: form.getValues('components') || [],
        ...product
      });
    } else {
      form.reset({
        code: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
        description: initialDescription || '',
        category: '',
        unit: 'UN',
        status: 'active',
        item_type: 'sale',
        tracks_batch: false,
        tracks_serial: false,
        tracks_expiry: false,
        tracks_manufacturing_date: false,
        is_composite: false,
        costPrice: 0,
        sellingPrice: 0,
        minSellingPrice: 0,
        minStock: 0,
        maxStock: 0,
        location: '',
        validityAlertDays: 0,
        ncm: '',
        cest: '',
        taxRegime: 'simples',
        origin: '0',
        cfop: '',
        icmsRate: 18,
        ipiRate: 0,
        pisRate: 0,
        cofinsRate: 0,
        issRate: 0,
        batches: [],
        components: []
      });
    }
  }, [product, open]);

  const onSubmit = async (values: ProductFormValues) => {
    if (!currentCompany) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        id: product?.id,
        company_id: currentCompany.id,
        code: values.code,
        description: values.description,
        category: values.category,
        unit: values.unit,
        status: values.status,
        item_type: values.item_type,
        tracks_batch: values.tracks_batch ? 1 : 0,
        tracks_serial: values.tracks_serial ? 1 : 0,
        tracks_expiry: values.tracks_expiry ? 1 : 0,
        tracks_manufacturing_date: values.tracks_manufacturing_date ? 1 : 0,
        is_composite: values.is_composite ? 1 : 0,
        cost_price: values.costPrice,
        selling_price: values.sellingPrice,
        min_selling_price: values.minSellingPrice,
        min_stock: values.minStock,
        max_stock: values.maxStock,
        physical_location: values.location,
        validity_alert_days: values.validityAlertDays,
        ncm: values.ncm,
        cest: values.cest,
        tax_regime: values.taxRegime,
        origin: values.origin,
        cfop: values.cfop,
        observations: values.observations,
        batches: values.batches,
        components: values.components
      };

      const res = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Falha ao salvar produto no servidor');
      }

      if (product) {
        toast.success('Produto atualizado com sucesso!');
      } else {
        toast.success('Produto cadastrado com sucesso!');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      toast.error(error.message || 'Ocorreu um erro ao salvar o produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const markup = form.watch('costPrice') > 0 
    ? ((form.watch('sellingPrice') - form.watch('costPrice')) / form.watch('costPrice') * 100).toFixed(2)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6 border-b bg-zinc-50 dark:bg-zinc-900/50">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                <Package className="h-6 w-6 text-emerald-600" />
                {product ? 'Editar Produto' : 'Novo Produto de Alta Performance'}
              </DialogTitle>
              <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 uppercase tracking-widest text-[10px] px-3">
                Cadastro Mestre
              </Badge>
            </div>
            <DialogDescription className="sr-only">
              Formulário para {product ? 'edição' : 'criação'} de produto.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
          <Tabs defaultValue="geral" className="w-full">
            <div className="px-6 border-b bg-white dark:bg-zinc-900 sticky top-0 z-10">
              <TabsList className="h-12 bg-transparent gap-6">
                <TabsTrigger value="geral" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Identificação</TabsTrigger>
                <TabsTrigger value="precos" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Preços & Margens</TabsTrigger>
                <TabsTrigger value="estoque" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Estoque & Logística</TabsTrigger>
                <TabsTrigger value="lotes" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Lotes & Rastreabilidade</TabsTrigger>
                <TabsTrigger value="componentes" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Componentes / Kit</TabsTrigger>
                <TabsTrigger value="historico" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Histórico & Nuances</TabsTrigger>
                {can('view_fiscal') && (
                  <TabsTrigger value="guia_tributario" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Guia Tributário</TabsTrigger>
                )}
                {can('view_fiscal') && (
                  <TabsTrigger value="fiscal" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 bg-transparent px-0">Configuração Fiscal</TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="geral" className="mt-0 space-y-6">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-4 space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Código / SKU</Label>
                    <Input {...form.register('code')} className="h-10 font-mono font-bold" />
                  </div>
                  <div className="col-span-8 space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Descrição Completa</Label>
                    <Input {...form.register('description')} className="h-10" placeholder="Ex: Placa de Circuito Impresso Rev 2.0" />
                  </div>
                  <div className="col-span-4 space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Categoria</Label>
                    <Select onValueChange={(v) => form.setValue('category', v)} defaultValue={form.getValues('category')}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Peças">Peças de Reposição</SelectItem>
                        <SelectItem value="Insumos">Insumos de Produção</SelectItem>
                        <SelectItem value="Serviços">Serviços Técnicos</SelectItem>
                        <SelectItem value="Equipamentos">Equipamentos Completos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Unidade de Medida</Label>
                    <Select onValueChange={(v) => form.setValue('unit', v)} defaultValue={form.getValues('unit')}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UN">Unidade (UN)</SelectItem>
                        <SelectItem value="PC">Peça (PC)</SelectItem>
                        <SelectItem value="MT">Metro (MT)</SelectItem>
                        <SelectItem value="KG">Quilo (KG)</SelectItem>
                        <SelectItem value="CX">Caixa (CX)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Status</Label>
                    <Select onValueChange={(v: any) => form.setValue('status', v)} defaultValue={form.getValues('status')}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="discontinued">Descontinuado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Classificação & Rastreabilidade do Estoque */}
                  <div className="col-span-12 border-t pt-4 mt-2">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          Classificação & Rastreabilidade do Estoque
                        </h4>
                        <p className="text-[11px] text-zinc-500">Defina a classificação e os controles rastreáveis estruturados do item no estoque.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-5 space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-zinc-500">Classificação Comercial / Operacional</Label>
                        <Select 
                          value={form.watch('item_type')} 
                          onValueChange={(val: any) => {
                            form.setValue('item_type', val);
                          }}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Selecione a classificação" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sale">Venda / Revenda (Comercial)</SelectItem>
                            <SelectItem value="part">Peça / Componente</SelectItem>
                            <SelectItem value="consumable">Consumo / Insumo Operacional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-7 flex flex-col justify-end gap-2 pb-1">
                        <Label className="text-[10px] uppercase font-bold text-zinc-500">Controles de Rastreabilidade & Composição</Label>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
                          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={form.watch('tracks_batch')} 
                              onChange={(e) => form.setValue('tracks_batch', e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            Controlar Lote
                          </label>
                          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={form.watch('tracks_serial')} 
                              onChange={(e) => form.setValue('tracks_serial', e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            Controlar Nº de Série
                          </label>
                          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={form.watch('tracks_expiry')} 
                              onChange={(e) => form.setValue('tracks_expiry', e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            Exigir Data de Validade
                          </label>
                          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={form.watch('tracks_manufacturing_date')} 
                              onChange={(e) => form.setValue('tracks_manufacturing_date', e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            Exigir Data de Fabricação
                          </label>
                          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer col-span-2 pt-0.5">
                            <input 
                              type="checkbox" 
                              checked={form.watch('is_composite')} 
                              onChange={(e) => form.setValue('is_composite', e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            Item Composto / Composição (BOM)
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="precos" className="mt-0 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-zinc-50 border space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> Composição de Preço
                    </h3>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-zinc-500">Preço de Custo (R$)</Label>
                      {can('view_cost_price') ? (
                        <Input type="number" step="0.01" {...form.register('costPrice', { valueAsNumber: true })} className="h-10 text-rose-600 font-bold" />
                      ) : (
                        <div className="h-10 flex items-center px-3 border rounded-md bg-zinc-100 text-zinc-400 text-sm italic">
                          Acesso restrito
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-zinc-500">Preço de Venda (R$)</Label>
                      <Input type="number" step="0.01" {...form.register('sellingPrice', { valueAsNumber: true })} className="h-10 text-emerald-600 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-zinc-500">Preço Mínimo de Venda (R$)</Label>
                      <Input type="number" step="0.01" {...form.register('minSellingPrice', { valueAsNumber: true })} className="h-10 text-zinc-600" />
                    </div>
                  </div>

                  {can('view_cost_price') && (
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex flex-col justify-center items-center text-center">
                      <BarChart3 className="h-8 w-8 text-emerald-600 mb-2" />
                      <p className="text-[10px] uppercase font-bold text-emerald-600">Markup Calculado</p>
                      <p className="text-4xl font-black text-emerald-700">{markup}%</p>
                      <p className="text-[10px] text-emerald-600 mt-2">Margem bruta sobre o custo</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="lotes" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Gestão de Lotes & Rastreabilidade</h3>
                      <p className="text-xs text-zinc-400">Identificação e datas de validade/fabricação. O saldo agregado oficial permanece em stock_balances.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => {
                      const currentBatches = form.getValues('batches') || [];
                      form.setValue('batches', [
                        ...currentBatches,
                        {
                          id: `BATCH-${Date.now()}`,
                          batchNumber: '',
                          quantity: 0,
                          status: 'active',
                          manufacturingDate: '',
                          expiryDate: '',
                          observations: '',
                          history: []
                        }
                      ]);
                    }}>
                      <Plus className="h-4 w-4" /> Novo Lote
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(form.watch('batches') || []).map((batch, index) => (
                      <div key={batch.id || index} className="p-4 rounded-lg border bg-white dark:bg-zinc-950 space-y-4">
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-3 space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-500">Nº Lote *</Label>
                            <Input 
                              value={batch.batchNumber} 
                              onChange={(e) => {
                                const newBatches = [...(form.getValues('batches') || [])];
                                newBatches[index].batchNumber = e.target.value;
                                form.setValue('batches', newBatches);
                              }}
                              className="h-9 font-mono" 
                              placeholder="LOTE-000"
                            />
                          </div>
                          <div className="col-span-3 space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-500">Data de Fabricação</Label>
                            <Input 
                              type="date" 
                              value={batch.manufacturingDate || ''} 
                              onChange={(e) => {
                                const newBatches = [...(form.getValues('batches') || [])];
                                newBatches[index].manufacturingDate = e.target.value;
                                form.setValue('batches', newBatches);
                              }}
                              className="h-9" 
                            />
                          </div>
                          <div className="col-span-3 space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-500">Data de Validade</Label>
                            <Input 
                              type="date"
                              value={batch.expiryDate || ''}
                              onChange={(e) => {
                                const newBatches = [...(form.getValues('batches') || [])];
                                newBatches[index].expiryDate = e.target.value;
                                form.setValue('batches', newBatches);
                              }}
                              className="h-9"
                            />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-500">Status</Label>
                            <Select 
                              value={batch.status} 
                              onValueChange={(v: any) => {
                                const newBatches = [...(form.getValues('batches') || [])];
                                newBatches[index].status = v;
                                form.setValue('batches', newBatches);
                              }}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Ativo</SelectItem>
                                <SelectItem value="blocked">Bloqueado</SelectItem>
                                <SelectItem value="expired">Vencido</SelectItem>
                                <SelectItem value="recalled">Recolhimento</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-1 flex items-end justify-end pb-1">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => {
                                const newBatches = [...(form.getValues('batches') || [])];
                                newBatches.splice(index, 1);
                                form.setValue('batches', newBatches);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-zinc-500">Observações & Ocorrências</Label>
                          <Textarea 
                            value={batch.observations}
                            onChange={(e) => {
                              const newBatches = [...(form.getValues('batches') || [])];
                              newBatches[index].observations = e.target.value;
                              form.setValue('batches', newBatches);
                            }}
                            className="text-xs min-h-[60px]" 
                            placeholder="Registre aqui qualquer ocorrência, erro de lote ou observação de rastreabilidade..."
                          />
                        </div>
                      </div>
                    ))}
                    
                    {(form.watch('batches') || []).length === 0 && (
                      <div className="text-center py-8 bg-zinc-50 border border-dashed rounded-lg">
                        <p className="text-sm text-zinc-500">Nenhum lote registrado para este produto.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="estoque" className="mt-0 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Estoque Mínimo</Label>
                    <Input type="number" {...form.register('minStock', { valueAsNumber: true })} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Estoque Máximo</Label>
                    <Input type="number" {...form.register('maxStock', { valueAsNumber: true })} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Alerta de Validade (Dias)</Label>
                    <Input type="number" {...form.register('validityAlertDays', { valueAsNumber: true })} className="h-10" placeholder="Ex: 30" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Localização Física</Label>
                    <Input {...form.register('location')} className="h-10" placeholder="Ex: Prateleira A1" />
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-3">
                  <Warehouse className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-blue-900">Gestão de Armazenagem</p>
                    <p className="text-xs text-blue-700">O sistema alertará automaticamente quando o saldo atingir o estoque mínimo definido.</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="componentes" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Composição do Produto (BOM)</h3>
                      <p className="text-xs text-zinc-400">Defina os componentes que formam este produto ou kit montado.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border rounded-lg flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[200px] space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-zinc-500">Selecionar Componente</Label>
                      <Select value={selectedCompId} onValueChange={setSelectedCompId}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Escolha um item do estoque..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProducts.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.code} - {p.description} ({p.unit || 'UN'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-zinc-500">Quantidade</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0.01" 
                        value={compQty} 
                        onChange={(e) => setCompQty(Number(e.target.value))} 
                        className="h-9" 
                      />
                    </div>
                    <Button 
                      type="button" 
                      size="sm" 
                      className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        if (!selectedCompId) {
                          toast.error('Selecione um componente para incluir');
                          return;
                        }
                        const found = availableProducts.find(p => p.id === selectedCompId);
                        if (!found) return;
                        const current = form.getValues('components') || [];
                        if (current.some(c => c.component_item_id === selectedCompId)) {
                          toast.error('Este componente já está na composição');
                          return;
                        }
                        form.setValue('components', [
                          ...current,
                          {
                            component_item_id: selectedCompId,
                            name: found.description,
                            code: found.code,
                            quantity: compQty,
                            unit: found.unit || 'UN',
                            cost: found.cost_price || found.costPrice || 0
                          }
                        ]);
                        form.setValue('is_composite', true);
                        setSelectedCompId('');
                        setCompQty(1);
                      }}
                    >
                      <Plus className="h-4 w-4" /> Incluir no BOM
                    </Button>
                  </div>

                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-100 dark:bg-zinc-800 border-b">
                        <tr>
                          <th className="p-2 text-left">Código</th>
                          <th className="p-2 text-left">Componente</th>
                          <th className="p-2 text-center w-24">Qtd</th>
                          <th className="p-2 text-center w-20">Un</th>
                          {can('view_cost_price') && <th className="p-2 text-right">Custo Unit.</th>}
                          {can('view_cost_price') && <th className="p-2 text-right">Custo Total</th>}
                          <th className="p-2 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(form.watch('components') || []).map((comp, i) => (
                          <tr key={comp.component_item_id || i} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                            <td className="p-2 font-mono text-xs text-zinc-500">{comp.code || '-'}</td>
                            <td className="p-2 font-medium">{comp.name || comp.component_item_id}</td>
                            <td className="p-2 text-center font-bold">{comp.quantity}</td>
                            <td className="p-2 text-center text-zinc-500">{comp.unit || 'UN'}</td>
                            {can('view_cost_price') && <td className="p-2 text-right">R$ {(comp.cost || 0).toFixed(2)}</td>}
                            {can('view_cost_price') && <td className="p-2 text-right font-bold">R$ {((comp.quantity || 1) * (comp.cost || 0)).toFixed(2)}</td>}
                            <td className="p-2 text-center">
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-rose-500 hover:text-rose-700"
                                onClick={() => {
                                  const updated = [...(form.getValues('components') || [])];
                                  updated.splice(i, 1);
                                  form.setValue('components', updated);
                                  if (updated.length === 0) {
                                    form.setValue('is_composite', false);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {(form.watch('components') || []).length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-zinc-400">
                              Nenhum componente vinculado. Utilize o seletor acima para adicionar peças ao BOM.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-zinc-50 dark:bg-zinc-900 font-bold">
                        <tr>
                          <td colSpan={can('view_cost_price') ? 5 : 3} className="p-2 text-right uppercase text-[10px]">Custo Total da Composição:</td>
                          {can('view_cost_price') ? (
                            <td className="p-2 text-right text-emerald-600 font-bold">
                              R$ {(form.watch('components') || []).reduce((acc, c) => acc + ((c.quantity || 1) * (c.cost || 0)), 0).toFixed(2)}
                            </td>
                          ) : (
                            <td className="p-2 text-right text-zinc-400 italic">Restrito</td>
                          )}
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-3">
                    <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-amber-800">
                      <p className="font-bold">Regra de Engenharia Nexus (Genealogia Rastreável):</p>
                      <p>Componentes → Montagem Física (Ordem de Montagem) → Baixa dos Componentes → Entrada do Kit Físico em estoque. A venda futura baixa o kit acabado com histórico completo de componentes utilizados.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="historico" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Anotações Técnicas e Nuances</h3>
                      <p className="text-xs text-zinc-400">Registre mudanças de composição, paradas de fabricação e outras observações importantes.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" /> Nova Anotação
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border bg-white dark:bg-zinc-950">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary" className="text-[10px]">Mudança de Composição</Badge>
                        <span className="text-xs text-zinc-500">15/03/2024</span>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">O fornecedor alterou a liga de alumínio da placa base da versão 1.0 para a 2.0. O peso reduziu em 15g, mas a resistência se manteve.</p>
                      <p className="text-xs text-zinc-400 mt-2">Por: Ricardo O.</p>
                    </div>
                    
                    <div className="p-4 rounded-lg border bg-white dark:bg-zinc-950">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary" className="text-[10px] bg-rose-100 text-rose-700">Aviso de Fornecimento</Badge>
                        <span className="text-xs text-zinc-500">10/01/2024</span>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">Produto com risco de descontinuação pelo fabricante principal. Buscar alternativas no mercado asiático.</p>
                      <p className="text-xs text-zinc-400 mt-2">Por: Ana Paula</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {can('view_fiscal') && (
                <TabsContent value="guia_tributario" className="mt-0 space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-emerald-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Guia de Preenchimento Tributário</h4>
                          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 mb-2">
                            Instruções internas para preenchimento correto de acordo com o regime tributário vigente.
                          </p>
                          <Textarea 
                            value={taxGuide}
                            onChange={(e) => setTaxGuide(e.target.value)}
                            placeholder="Ex: Para Simples Nacional usar CSOSN 102. Para Lucro Real usar CST 00 com alíquota de 18%..."
                            className="bg-white dark:bg-zinc-950 text-xs min-h-[150px]"
                          />
                          <div className="mt-2 flex justify-end">
                            <Button type="button" size="sm" onClick={saveTaxGuide} className="bg-emerald-600 hover:bg-emerald-700">
                              <Save className="h-4 w-4 mr-2" /> Salvar Guia
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              {can('view_fiscal') && (
                <TabsContent value="fiscal" className="mt-0 space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-[10px] uppercase font-black text-zinc-400 tracking-widest border-b pb-2">Classificação Fiscal</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-500">NCM</Label>
                            <Input {...form.register('ncm')} className="h-9" placeholder="0000.00.00" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-500">CEST</Label>
                            <Input {...form.register('cest')} className="h-9" placeholder="00.000.00" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-500">Origem</Label>
                            <Select onValueChange={(v) => form.setValue('origin', v)} defaultValue={form.getValues('origin')}>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0 - Nacional</SelectItem>
                                <SelectItem value="1">1 - Estrangeira - Imp. Direta</SelectItem>
                                <SelectItem value="2">2 - Estrangeira - Merc. Interno</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-500">CFOP Padrão</Label>
                            <Input {...form.register('cfop')} className="h-9" placeholder="5102" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] uppercase font-black text-zinc-400 tracking-widest border-b pb-2">Regime e Impostos</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-500">Regime Tributário da Empresa</Label>
                            <Select onValueChange={(v: any) => form.setValue('taxRegime', v)} defaultValue={form.getValues('taxRegime')}>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="simples">Simples Nacional</SelectItem>
                                <SelectItem value="presumido">Lucro Presumido</SelectItem>
                                <SelectItem value="real">Lucro Real</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-500">ICMS (%)</Label>
                            <Input type="number" {...form.register('icmsRate', { valueAsNumber: true })} className="h-9" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-500">IPI (%)</Label>
                            <Input type="number" {...form.register('ipiRate', { valueAsNumber: true })} className="h-9" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-500">PIS (%)</Label>
                            <Input type="number" {...form.register('pisRate', { valueAsNumber: true })} className="h-9" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-500">COFINS (%)</Label>
                            <Input type="number" {...form.register('cofinsRate', { valueAsNumber: true })} className="h-9" />
                          </div>
                          {form.watch('category') === 'Serviços' && (
                            <div className="col-span-2 space-y-2">
                              <Label className="text-[10px] uppercase font-bold text-zinc-500">ISS (%)</Label>
                              <Input type="number" {...form.register('issRate', { valueAsNumber: true })} className="h-9" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-amber-900">Conformidade Fiscal</p>
                        <p className="text-xs text-amber-700">Estas informações são essenciais para a emissão correta de Notas Fiscais (NF-e).</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>

          <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 px-8 h-10 font-bold">
              {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
