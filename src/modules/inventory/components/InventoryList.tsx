import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Package, 
  ShoppingCart,
  Download,
  Upload,
  CheckSquare,
  Square,
  ChevronDown,
  Trash2,
  TrendingUp
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { StockEntryForm } from './StockEntryForm';
import { PurchaseRequestForm } from './PurchaseRequestForm';
import { ProductForm } from './ProductForm';
import { ProductDetailsModal } from './ProductDetailsModal';
import { AdvancedSearchModal } from '@/components/common/AdvancedSearchModal';

// ... existing imports ...

interface InventoryItem {
  id: string;
  code: string;
  description: string;
  category: string;
  unit: string;
  total_quantity: number;
  status: string;
  item_type?: string;
  tracks_batch?: number | boolean;
  tracks_serial?: number | boolean;
  tracks_expiry?: number | boolean;
  tracks_manufacturing_date?: number | boolean;
  is_composite?: number | boolean;
  physical_location?: string;
  costPrice?: number;
  sellingPrice?: number;
  minStock?: number;
  maxStock?: number;
  location?: string;
  ncm?: string;
  cest?: string;
  icmsRate?: number;
  ipiRate?: number;
}

export function InventoryList() {
  const { currentCompany } = useApp();
  const { can } = usePermissions();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);
  
  // Details Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Advanced Search State
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any[]>([]);

  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const fetchItems = () => {
    if (currentCompany) {
      setLoading(true);
      fetch(`/api/inventory/items?companyId=${currentCompany.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.length === 0) {
            setItems([
              { id: '1', code: 'P001', description: 'Placa Principal Raio-X GE', category: 'Peças', unit: 'UN', total_quantity: 5, status: 'active', costPrice: 1200, sellingPrice: 2500, minStock: 2, maxStock: 10 },
              { id: '2', code: 'P002', description: 'Sensor de Temperatura Industrial', category: 'Sensores', unit: 'UN', total_quantity: 12, status: 'active', costPrice: 150, sellingPrice: 450, minStock: 5, maxStock: 30 },
              { id: '3', code: 'P003', description: 'Cabo de Fibra Óptica 10m', category: 'Cabos', unit: 'MT', total_quantity: 150, status: 'active', costPrice: 45, sellingPrice: 120, minStock: 50, maxStock: 500 },
            ]);
          } else {
            setItems(data);
          }
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentCompany]);

  const handleViewDetails = (item: InventoryItem) => {
    setSelectedItem(item);
    setDetailsModalOpen(true);
  };

  const handleEditProduct = (item: InventoryItem) => {
    setEditingProduct(item);
    setProductFormOpen(true);
  };

  const handleAdvancedSearch = (filters: any[]) => {
    setActiveFilters(filters);
    // Here you would typically fetch filtered data from the API
    // For now, we'll just log the filters
    console.log('Applying filters:', filters);
    toast.success(`${filters.length} filtros aplicados!`);
  };

  const filteredItems = items.filter(item => {
    // Basic search
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Advanced filters (mock implementation)
    if (activeFilters.length > 0) {
      // Check if item matches ALL filters
      const matchesFilters = activeFilters.every(filter => {
        const itemValue = String(item[filter.field as keyof InventoryItem] || '').toLowerCase();
        const filterValue = filter.value.toLowerCase();
        
        switch (filter.operator) {
          case 'contains': return itemValue.includes(filterValue);
          case 'equals': return itemValue === filterValue;
          case 'greater': return Number(itemValue) > Number(filterValue);
          case 'less': return Number(itemValue) < Number(filterValue);
          default: return true;
        }
      });
      return matchesSearch && matchesFilters;
    }

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* ... Header and Stats Cards ... */}

      <AdvancedSearchModal
        open={advancedSearchOpen}
        onOpenChange={setAdvancedSearchOpen}
        onSearch={handleAdvancedSearch}
        fields={[
          { label: 'Código', key: 'code', type: 'text' },
          { label: 'Descrição', key: 'description', type: 'text' },
          { label: 'Categoria', key: 'category', type: 'select' },
          { label: 'Quantidade Total', key: 'total_quantity', type: 'number' },
          { label: 'Preço Custo', key: 'costPrice', type: 'number' },
          { label: 'Preço Venda', key: 'sellingPrice', type: 'number' },
          { label: 'Status', key: 'status', type: 'select' },
        ]}
      />

      <StockEntryForm 
        open={entryFormOpen} 
        onOpenChange={setEntryFormOpen}
        onSuccess={fetchItems}
      />

      <ProductForm 
        open={productFormOpen}
        onOpenChange={setProductFormOpen}
        onSuccess={fetchItems}
        product={editingProduct}
      />

      <PurchaseRequestForm 
        open={requestFormOpen}
        onOpenChange={setRequestFormOpen}
        onSuccess={() => {}} 
      />

      <ProductDetailsModal 
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        product={selectedItem}
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar por código ou descrição..."
                className="pl-8 pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1 h-7 w-7 text-zinc-500 hover:text-blue-600"
                onClick={() => setAdvancedSearchOpen(true)}
                title="Pesquisa Avançada"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            {selectedRows.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="gap-2">
                    Ações em Massa ({selectedRows.length}) <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2" onClick={() => toast.success(`Exportando ${selectedRows.length} itens...`)}>
                    <Download className="h-4 w-4" /> Exportar Selecionados
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => toast.info('Funcionalidade de alteração em massa em breve.')}>
                    <Filter className="h-4 w-4" /> Mudar Categoria
                  </DropdownMenuItem>
                  {can('edit_products') && (
                    <DropdownMenuItem className="gap-2 text-rose-600" onClick={() => toast.error('Confirmação de exclusão necessária.')}>
                      <Trash2 className="h-4 w-4" /> Excluir Selecionados
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {activeFilters.map((filter) => (
                <Badge key={filter.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-100">
                  <span className="font-bold">{filter.fieldLabel}</span>
                  <span className="text-zinc-400 mx-1">•</span>
                  <span>{filter.operator === 'contains' ? 'contém' : filter.operator}</span>
                  <span className="text-zinc-400 mx-1">•</span>
                  <span className="font-mono font-bold">"{filter.value}"</span>
                  <button 
                    onClick={() => {
                      const newFilters = activeFilters.filter(f => f.id !== filter.id);
                      setActiveFilters(newFilters);
                    }} 
                    className="ml-1 hover:bg-blue-100 rounded-full p-0.5"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-zinc-500 hover:text-zinc-900"
                onClick={() => setActiveFilters([])}
              >
                Limpar tudo
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4"
                      onClick={() => {
                        if (selectedRows.length === filteredItems.length) setSelectedRows([]);
                        else setSelectedRows(filteredItems.map(i => i.id));
                      }}
                    >
                      {selectedRows.length === filteredItems.length && filteredItems.length > 0 ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Square className="h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Saldo Total</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-zinc-500">
                      Carregando itens...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-zinc-500">
                      Nenhum item encontrado.
                    </TableCell>
                  </TableRow>
                ) : filteredItems.map((item) => (
                  <TableRow key={item.id} className={cn(selectedRows.includes(item.id) && "bg-emerald-50/30 dark:bg-emerald-900/10")}>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4"
                        onClick={() => {
                          if (selectedRows.includes(item.id)) setSelectedRows(selectedRows.filter(id => id !== item.id));
                          else setSelectedRows([...selectedRows, item.id]);
                        }}
                      >
                        {selectedRows.includes(item.id) ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Square className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.code}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{item.description}</span>
                        {Boolean(item.is_composite || item.item_type === 'kit') && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 bg-purple-50 text-purple-700 border-purple-200">
                            Kit
                          </Badge>
                        )}
                        {Boolean(item.tracks_batch || item.item_type === 'batch') && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                            Lote
                          </Badge>
                        )}
                        {Boolean(item.tracks_serial || item.item_type === 'serial') && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 bg-amber-50 text-amber-700 border-amber-200">
                            Serial
                          </Badge>
                        )}
                        {item.item_type === 'part' && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 bg-slate-50 text-slate-700 border-slate-200">
                            Peça
                          </Badge>
                        )}
                        {(item.item_type === 'consumable' || item.item_type === 'raw_material') && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 bg-zinc-100 text-zinc-700 border-zinc-200">
                            Consumo
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.category || '-'}</TableCell>
                    <TableCell className="text-right font-bold">
                      {item.total_quantity || 0}
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'active' ? 'outline' : 'destructive'} className={item.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}>
                        {item.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {can('edit_products') && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditProduct(item)}
                          >
                            Editar
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(item)}
                        >
                          Histórico
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile / Tablet Cards */}
          <div className="lg:hidden space-y-4">
            {loading ? (
              <div className="text-center py-10 text-zinc-500">Carregando itens...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">Nenhum item encontrado.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} className={cn(
                    "border-zinc-200 dark:border-zinc-800 shadow-sm",
                    selectedRows.includes(item.id) && "ring-2 ring-emerald-500 dark:ring-emerald-600"
                  )}>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {can('edit_products') && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-4 w-4 shrink-0"
                                onClick={() => {
                                  if (selectedRows.includes(item.id)) setSelectedRows(selectedRows.filter(id => id !== item.id));
                                  else setSelectedRows([...selectedRows, item.id]);
                                }}
                              >
                                {selectedRows.includes(item.id) ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Square className="h-4 w-4" />}
                              </Button>
                            )}
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.description}</h3>
                            {Boolean(item.is_composite || item.item_type === 'kit') && (
                              <Badge variant="outline" className="text-[9px] py-0 h-4 bg-purple-50 text-purple-700 border-purple-200">
                                Kit
                              </Badge>
                            )}
                            {Boolean(item.tracks_batch || item.item_type === 'batch') && (
                              <Badge variant="outline" className="text-[9px] py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                                Lote
                              </Badge>
                            )}
                            {Boolean(item.tracks_serial || item.item_type === 'serial') && (
                              <Badge variant="outline" className="text-[9px] py-0 h-4 bg-amber-50 text-amber-700 border-amber-200">
                                Serial
                              </Badge>
                            )}
                            {item.item_type === 'part' && (
                              <Badge variant="outline" className="text-[9px] py-0 h-4 bg-slate-50 text-slate-700 border-slate-200">
                                Peça
                              </Badge>
                            )}
                            {(item.item_type === 'consumable' || item.item_type === 'raw_material') && (
                              <Badge variant="outline" className="text-[9px] py-0 h-4 bg-zinc-100 text-zinc-700 border-zinc-200">
                                Consumo
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs font-mono text-zinc-500">{item.code}</p>
                        </div>
                        <Badge variant={item.status === 'active' ? 'outline' : 'destructive'} className={cn(
                          "shrink-0 text-[10px] h-5",
                          item.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''
                        )}>
                          {item.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-zinc-400">Saldo Total</p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {item.total_quantity || 0} <span className="text-xs font-normal text-zinc-500">{item.unit}</span>
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-zinc-400">Categoria</p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{item.category || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        {can('edit_products') && (
                          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-medium" onClick={() => handleEditProduct(item)}>
                            Editar
                          </Button>
                        )}
                        <Button variant="secondary" size="sm" className="flex-1 h-8 text-xs font-medium" onClick={() => handleViewDetails(item)}>
                          Histórico
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
