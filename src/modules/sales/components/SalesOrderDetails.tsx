import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrackingTimeline, TimelineEvent } from '@/components/ui/TrackingTimeline';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  User, 
  Calendar, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  ChevronRight, 
  Clock, 
  Truck, 
  Receipt,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface OrderItem {
  id: string;
  item_name: string;
  item_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  batch?: string;
  expiry?: string;
}

interface OrderDetails {
  id: string;
  customer_name: string;
  customer_doc: string;
  total_amount: number;
  status: string;
  notes: string;
  created_at: string;
  items: OrderItem[];
  payment_due_date?: string;
  payment_status?: 'pending' | 'paid' | 'overdue';
}

interface SalesOrderDetailsProps {
  order: OrderDetails | null;
  loading?: boolean;
  onConfirm?: () => void;
  showSensitiveData?: boolean;
}

import { usePermissions } from '@/hooks/usePermissions';

export function SalesOrderDetails({ order, loading, onConfirm, showSensitiveData = true }: SalesOrderDetailsProps) {
  const [confirming, setConfirming] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { can } = usePermissions();
  const showPrices = can('view_sales') || can('view_financials');

  const steps = [
    { id: 'received', label: 'Recebido', icon: Clock },
    { id: 'docs', label: 'Documentação', icon: ShieldCheck },
    { id: 'confirmed', label: 'Confirmado', icon: CheckCircle },
    { id: 'separation', label: 'Separação', icon: Package },
    { id: 'billing', label: 'Faturamento', icon: Receipt },
    { id: 'shipped', label: 'Enviado', icon: Truck },
    { id: 'delivered', label: 'Entregue', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(s => {
    if (order?.status === 'draft') return s.id === 'received';
    if (order?.status === 'confirmed') return s.id === 'confirmed';
    if (order?.status === 'shipped') return s.id === 'shipped';
    return false;
  });

  const handleConfirm = async () => {
    if (!order) return;
    setConfirming(true);
    try {
      const response = await fetch(`/api/sales/orders/${order.id}/confirm`, {
        method: 'PUT'
      });
      if (response.ok) {
        toast.success('Pedido confirmado e estoque reservado.');
        onConfirm?.();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Erro ao confirmar pedido');
      }
    } catch (error) {
      toast.error('Erro na comunicação com o servidor');
    } finally {
      setConfirming(false);
    }
  };

  const handleShip = async () => {
    if (!order) return;
    setShipping(true);
    try {
      const response = await fetch(`/api/sales/orders/${order.id}/ship`, {
        method: 'PUT'
      });
      if (response.ok) {
        toast.success('Pedido enviado e estoque físico baixado.');
        onConfirm?.();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Erro ao enviar pedido');
      }
    } catch (error) {
      toast.error('Erro na comunicação com o servidor');
    } finally {
      setShipping(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      const response = await fetch(`/api/sales/orders/${order.id}/cancel`, {
        method: 'PUT'
      });
      if (response.ok) {
        toast.success('Pedido cancelado e reserva liberada.');
        onConfirm?.();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Erro ao cancelar pedido');
      }
    } catch (error) {
      toast.error('Erro na comunicação com o servidor');
    } finally {
      setCancelling(false);
    }
  };

  const isConfirmedOrBeyond = order?.status === 'confirmed' || order?.status === 'shipped';

  const timelineEvents: TimelineEvent[] = [
    {
      id: '1',
      title: 'Cotação Realizada',
      description: 'Orçamento inicial criado pelo vendedor.',
      date: format(new Date(order?.created_at || new Date()), 'dd/MM/yyyy'),
      time: format(new Date(order?.created_at || new Date()), 'HH:mm'),
      status: 'completed',
      icon: FileText
    },
    {
      id: '2',
      title: 'Cotação Aprovada',
      description: 'Cliente aprovou os valores e condições.',
      date: format(new Date(order?.created_at || new Date()), 'dd/MM/yyyy'),
      time: format(new Date(order?.created_at || new Date()), 'HH:mm'),
      status: 'completed',
      icon: CheckCircle
    },
    {
      id: '3',
      title: 'Consultado Cliente',
      description: 'Verificação de crédito e pendências financeiras.',
      date: format(new Date(order?.created_at || new Date()), 'dd/MM/yyyy'),
      time: format(new Date(order?.created_at || new Date()), 'HH:mm'),
      status: 'completed',
      icon: User,
      metadata: [
        { label: 'Status', value: 'Cliente OK' },
        { label: 'Limite', value: 'Aprovado' }
      ]
    },
    {
      id: '4',
      title: 'Pedido Confirmado',
      description: 'Pedido confirmado e reserva de estoque gerada.',
      date: isConfirmedOrBeyond ? format(new Date(), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy'),
      time: isConfirmedOrBeyond ? format(new Date(), 'HH:mm') : format(new Date(), 'HH:mm'),
      status: isConfirmedOrBeyond ? 'completed' : 'current',
      icon: Package
    },
    {
      id: '5',
      title: 'Material Reservado no Estoque',
      description: order?.status === 'shipped' 
        ? 'Reserva consumida e saída física realizada no envio.' 
        : 'Itens reservados no sistema aguardando separação/envio.',
      date: isConfirmedOrBeyond ? format(new Date(), 'dd/MM/yyyy') : '---',
      time: isConfirmedOrBeyond ? format(new Date(), 'HH:mm') : '--:--',
      status: isConfirmedOrBeyond ? 'completed' : 'pending',
      icon: Package
    },
    {
      id: '6',
      title: 'Saída Física e Envio',
      description: order?.status === 'shipped' 
        ? 'Mercadoria despachada com baixa física efetuada.' 
        : 'Aguardando conferência e envio físico.',
      date: order?.status === 'shipped' ? format(new Date(), 'dd/MM/yyyy') : '---',
      time: order?.status === 'shipped' ? format(new Date(), 'HH:mm') : '--:--',
      status: order?.status === 'shipped' ? 'completed' : 'pending',
      icon: Truck
    },
    {
      id: '7',
      title: 'Nota Fiscal Emitida',
      description: 'NF-e gerada e autorizada na SEFAZ.',
      date: '---',
      time: '--:--',
      status: 'pending',
      icon: Receipt,
      metadata: [
        { label: 'NF', value: '1234' },
        { label: 'Chave', value: '3524 03... 1234' }
      ]
    },
    {
      id: '8',
      title: 'Aguardando Coleta',
      description: 'Pedido embalado e pronto para transportadora.',
      date: '---',
      time: '--:--',
      status: 'pending',
      icon: Truck,
      metadata: [
        { label: 'Volumes', value: '01/02' },
        { label: 'Peso', value: '2kg' },
        { label: 'Dimensões', value: '30x40x50cm' }
      ]
    }
  ];

  // ... existing handleConfirm ...

  if (loading) {
    return <div className="p-8 text-center animate-pulse">Carregando detalhes...</div>;
  }

  if (!order) return null;

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="details">Detalhes do Pedido</TabsTrigger>
        <TabsTrigger value="tracking">Rastreamento & Evolução</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-8">
        {/* Flowchart (Azul Style) */}
        <div className="relative flex justify-between items-center px-4 py-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          {/* ... existing flowchart content ... */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 z-0" />
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 group min-w-[80px]">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 border-4",
                  isCompleted ? "bg-emerald-500 border-emerald-100 text-white dark:border-emerald-900/30" : 
                  isCurrent ? "bg-blue-600 border-blue-100 text-white animate-pulse dark:border-blue-900/30" : 
                  "bg-white border-zinc-100 text-zinc-400 dark:bg-zinc-950 dark:border-zinc-800"
                )}>
                  {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-tighter text-center",
                  isCompleted ? "text-emerald-600" : isCurrent ? "text-blue-600" : "text-zinc-400"
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Header Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ... existing header info content ... */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Dados do Cliente</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-zinc-400" />
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{order.customer_name}</span>
              </div>
              <p className="text-xs text-zinc-500">{order.customer_doc}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Vencimento</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <span className="text-xs font-medium">
                    {order.payment_due_date ? format(new Date(order.payment_due_date), 'dd/MM/yyyy') : 'A definir'}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Status Financeiro</p>
                <Badge className={cn(
                  "text-[10px] font-bold uppercase",
                  order.payment_status === 'paid' ? "bg-emerald-500" : 
                  order.payment_status === 'overdue' ? "bg-rose-500" : "bg-amber-500"
                )}>
                  {order.payment_status === 'paid' ? 'Pago' : 
                   order.payment_status === 'overdue' ? 'Vencido' : 'Pendente'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 p-4 rounded-xl border dark:bg-zinc-900/50 flex flex-col justify-center items-end">
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest mb-1">Valor Total</p>
            {showPrices ? (
              <p className="text-4xl font-bold text-emerald-600">
                {order.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            ) : (
              <p className="text-2xl font-bold text-zinc-400 italic">Oculto</p>
            )}
            <p className="text-[10px] text-zinc-400 mt-2">
              Criado em {format(new Date(order.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>

        {order.status === 'draft' && (
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-bold shadow-lg shadow-emerald-500/20"
            onClick={handleConfirm}
            disabled={confirming}
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            {confirming ? 'Confirmando...' : 'Confirmar Pedido e Reservar Estoque'}
          </Button>
        )}

        {order.status === 'confirmed' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-bold shadow-lg shadow-emerald-500/20"
              onClick={handleShip}
              disabled={shipping || cancelling}
            >
              <Truck className="mr-2 h-5 w-5" />
              {shipping ? 'Enviando...' : 'Enviar Pedido'}
            </Button>
            <Button 
              variant="outline"
              className="border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-12 text-base font-bold"
              onClick={handleCancel}
              disabled={shipping || cancelling}
            >
              <AlertCircle className="mr-2 h-5 w-5" />
              {cancelling ? 'Cancelando...' : 'Cancelar Pedido'}
            </Button>
          </div>
        )}

        <Separator />

        {/* Items Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Package className="h-4 w-4 text-zinc-400" />
            Itens do Pedido
          </h3>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold">Produto</TableHead>
                  <TableHead className="text-right text-[10px] uppercase font-bold">Qtd</TableHead>
                  {showPrices && <TableHead className="text-right text-[10px] uppercase font-bold">Unitário</TableHead>}
                  {showSensitiveData && <TableHead className="text-[10px] uppercase font-bold">Lote/Validade</TableHead>}
                  {showPrices && <TableHead className="text-right text-[10px] uppercase font-bold">Total</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.item_name}</span>
                        <span className="text-[10px] font-mono text-zinc-400">{item.item_code}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                    {showPrices && (
                      <TableCell className="text-right text-sm">
                        {item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    )}
                    {showSensitiveData && (
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold">{item.batch || 'N/A'}</span>
                          <span className="text-[10px] text-zinc-400">{item.expiry || ''}</span>
                        </div>
                      </TableCell>
                    )}
                    {showPrices && (
                      <TableCell className="text-right font-bold text-sm">
                        {item.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-zinc-400" />
              Observações
            </h3>
            <div className="p-4 rounded-lg bg-zinc-50 border text-sm text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-400">
              {order.notes}
            </div>
          </div>
        )}

        {/* Financial Info */}
        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-900/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 dark:bg-blue-900/50">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-900 dark:text-blue-100 uppercase tracking-widest">Financeiro Gerado</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">1 parcela de {order.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} com vencimento em 30 dias.</p>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="tracking" className="space-y-6">
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Rastreamento do Pedido
          </h3>
          <TrackingTimeline events={timelineEvents} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
