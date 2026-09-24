import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
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
  FileText, 
  ShoppingBag,
  Download,
  Upload,
  CheckSquare,
  Square,
  ChevronDown,
  Trash2,
  TrendingUp,
  DollarSign,
  Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SalesOrderForm } from './SalesOrderForm';
import { SalesOrderDetails } from './SalesOrderDetails';
import { ShareMenu } from "@/components/shared/ShareMenu";
import { usePrivacy, PrivacyMask } from '@/context/PrivacyContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface SalesOrder {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  branch_name: string;
  user_name: string;
}

import { usePermissions } from '@/hooks/usePermissions';

import { Lock } from 'lucide-react';

export function SalesOrderList() {
  const { currentCompany } = useApp();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const { can, role } = usePermissions();
  const { showSensitiveData } = usePrivacy();
  const showValues = (can('view_sales') || can('view_financials')) && showSensitiveData;
  const [showMyOrdersOnly, setShowMyOrdersOnly] = useState(role === 'sales');
  
  // Mock current user for filtering
  const currentUserName = 'Carlos Silva';

  // Details Panel State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  if (!can('view_sales')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar os pedidos de venda.</p>
        </div>
      </div>
    );
  }

  const fetchOrders = () => {
    if (currentCompany) {
      setLoading(true);
      fetch(`/api/sales/orders?companyId=${currentCompany.id}`)
        .then(res => res.json())
        .then(data => {
          setOrders(data);
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentCompany]);

  const fetchOrderDetails = (orderId: string) => {
    setLoadingDetails(true);
    fetch(`/api/sales/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        setSelectedOrder(data);
        setLoadingDetails(false);
      });
  };

  const handleViewDetails = (orderId: string) => {
    fetchOrderDetails(orderId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-zinc-200">Rascunho</Badge>;
      case 'confirmed': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmado</Badge>;
      case 'shipped': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Enviado</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = showMyOrdersOnly ? order.user_name === currentUserName : true;

    return matchesSearch && matchesUser;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Pedidos de Venda</h2>
          <p className="text-zinc-500 text-sm">Gestão de orçamentos, pedidos e faturamento.</p>
        </div>
        <div className="flex gap-2">
          {role === 'sales' && (
            <Button 
              variant={showMyOrdersOnly ? "default" : "outline"}
              size="sm"
              className="h-9 gap-2"
              onClick={() => setShowMyOrdersOnly(!showMyOrdersOnly)}
            >
              <ShoppingBag className="h-4 w-4" /> Meus Pedidos
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-9" onClick={() => toast.info('Funcionalidade de importação de pedidos em breve.')}>
            <Upload className="mr-2 h-4 w-4" /> Importar
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => toast.success('Exportando lista de pedidos...')}>
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          {can('edit_sales') && (
            <Button 
              size="sm" 
              className="h-9 bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              onClick={() => setOrderFormOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Pedido
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500">Pedidos (Mês)</p>
              <p className="text-xl font-bold">{orders.length || 124}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500">Faturamento</p>
              <p className="text-xl font-bold text-emerald-600">
                <PrivacyMask value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(128400)} />
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500">Em Aberto</p>
              <p className="text-xl font-bold">18</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500">Ticket Médio</p>
              <p className="text-xl font-bold">
                <PrivacyMask value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(1035)} />
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <SalesOrderForm 
        open={orderFormOpen} 
        onOpenChange={setOrderFormOpen}
        onSuccess={fetchOrders}
      />

      {/* Details Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <ShoppingBag className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Detalhes do Pedido</span>
              </div>
              {selectedOrder && <ShareMenu data={selectedOrder} type="pedido" size="sm" variant="ghost" />}
            </div>
            <SheetTitle className="text-2xl font-bold tracking-tight">Pedido #{selectedOrder?.id?.split('_')[1] || selectedOrder?.id}</SheetTitle>
            <SheetDescription className="font-mono text-xs">
              Filial: {selectedOrder?.branch_name} • Vendedor: {selectedOrder?.user_name}
            </SheetDescription>
          </SheetHeader>

          <div className="py-6">
            <SalesOrderDetails 
              order={selectedOrder} 
              loading={loadingDetails} 
              onConfirm={() => {
                fetchOrders();
                fetchOrderDetails(selectedOrder.id);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar por cliente ou número do pedido..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {selectedRows.length > 0 && (
              <>
                <ShareMenu 
                  data={filteredOrders.filter(o => selectedRows.includes(o.id))} 
                  type="pedido" 
                  label={`Compartilhar (${selectedRows.length})`} 
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm" className="gap-2">
                      Ações em Massa ({selectedRows.length}) <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2" onClick={() => toast.success(`Gerando PDF para ${selectedRows.length} pedidos...`)}>
                    <FileText className="h-4 w-4" /> Gerar PDF Selecionados
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => toast.success(`Exportando ${selectedRows.length} pedidos...`)}>
                    <Download className="h-4 w-4" /> Exportar Selecionados
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-rose-600" onClick={() => toast.error('Confirmação de exclusão necessária.')}>
                    <Trash2 className="h-4 w-4" /> Excluir Selecionados
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4"
                    onClick={() => {
                      if (selectedRows.length === filteredOrders.length) setSelectedRows([]);
                      else setSelectedRows(filteredOrders.map(o => o.id));
                    }}
                  >
                    {selectedRows.length === filteredOrders.length && filteredOrders.length > 0 ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Square className="h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Filial</TableHead>
                {showValues && <TableHead className="text-right">Valor Total</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={showValues ? 8 : 7} className="text-center py-10">Carregando pedidos...</TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showValues ? 8 : 7} className="text-center py-10 text-zinc-500">
                    Nenhum pedido encontrado.
                  </TableCell>
                </TableRow>
              ) : filteredOrders.map((order) => (
                <TableRow key={order.id} className={cn(selectedRows.includes(order.id) && "bg-emerald-50/30 dark:bg-emerald-900/10")}>
                  {/* ... checkbox ... */}
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4"
                      onClick={() => {
                        if (selectedRows.includes(order.id)) setSelectedRows(selectedRows.filter(id => id !== order.id));
                        else setSelectedRows([...selectedRows, order.id]);
                      }}
                    >
                      {selectedRows.includes(order.id) ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Square className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold">{order.id}</TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {format(new Date(order.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">{order.customer_name}</TableCell>
                  <TableCell className="text-sm">{order.branch_name}</TableCell>
                  {showValues && (
                    <TableCell className="text-right font-bold">
                      <PrivacyMask value={order.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                    </TableCell>
                  )}
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <ShareMenu data={order} type="pedido" size="icon" variant="ghost" className="h-8 w-8 text-zinc-500" />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewDetails(order.id)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
