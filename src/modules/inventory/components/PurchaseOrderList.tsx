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
import { Plus, Search, Filter, FileText, ShoppingBag, CheckCircle, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { PurchaseOrderForm } from './PurchaseOrderForm';

interface PurchaseOrder {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  user_name: string;
}

export function PurchaseOrderList() {
  const { currentCompany } = useApp();
  const { can } = usePermissions();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);

  if (!can('view_purchase_orders')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar pedidos de compra.</p>
        </div>
      </div>
    );
  }

  const fetchOrders = () => {
    if (currentCompany) {
      setLoading(true);
      fetch(`/api/purchase-orders?companyId=${currentCompany.id}`)
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

  const handleConfirm = async (orderId: string) => {
    try {
      const response = await fetch(`/api/purchase-orders/${orderId}/confirm`, { method: 'PUT' });
      if (response.ok) {
        toast.success('Pedido confirmado e conta a pagar gerada!');
        fetchOrders();
      }
    } catch (error) {
      toast.error('Erro ao confirmar pedido');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-zinc-200">Rascunho</Badge>;
      case 'confirmed': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmado</Badge>;
      case 'received': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Recebido</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Pedidos de Compra</h2>
        {can('create_purchase_orders') && (
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => {
            setEditingOrder(null);
            setIsFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
        )}
      </div>

      <PurchaseOrderForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={fetchOrders}
        order={editingOrder}
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar pedidos..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10">Carregando...</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-zinc-500">Nenhum pedido encontrado.</TableCell></TableRow>
              ) : orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-bold">#{order.id.split('_')[1] || order.id}</TableCell>
                  <TableCell className="text-xs">
                    {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-sm">{order.user_name}</TableCell>
                  <TableCell className="text-right font-bold">
                    {order.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {order.status === 'draft' && can('create_purchase_orders') && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-emerald-600"
                          onClick={() => handleConfirm(order.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Confirmar
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
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
