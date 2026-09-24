import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PurchaseRequestForm } from './PurchaseRequestForm';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  User,
  Package,
  Filter,
  ArrowRight,
  FileText,
  DollarSign,
  Lock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface PurchaseRequest {
  id: string;
  item: string;
  quantity: number;
  unit: string;
  requester: string;
  department: string;
  status: 'Pendente' | 'Aprovado' | 'Cotando' | 'Comprado' | 'Cancelado';
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  date: string;
  estimatedValue: number;
}

export function PurchaseRequestList() {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!can('view_purchase_requests')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar solicitações de compra.</p>
        </div>
      </div>
    );
  }

  const requests: PurchaseRequest[] = [
    { 
      id: 'SOL-2024-001', 
      item: 'Cabo de Rede Cat6 - 305m', 
      quantity: 5, 
      unit: 'CX', 
      requester: 'Carlos Silva', 
      department: 'Técnico', 
      status: 'Pendente', 
      priority: 'Alta', 
      date: '2024-03-20', 
      estimatedValue: 1250.00 
    },
    { 
      id: 'SOL-2024-002', 
      item: 'Switch 24 Portas Gigabit', 
      quantity: 2, 
      unit: 'UN', 
      requester: 'Ana Oliveira', 
      department: 'TI', 
      status: 'Cotando', 
      priority: 'Urgente', 
      date: '2024-03-18', 
      estimatedValue: 3400.00 
    },
    { 
      id: 'SOL-2024-003', 
      item: 'Papel A4 - 500 fls', 
      quantity: 10, 
      unit: 'PCT', 
      requester: 'Marcos Santos', 
      department: 'ADM', 
      status: 'Aprovado', 
      priority: 'Baixa', 
      date: '2024-03-21', 
      estimatedValue: 250.00 
    },
    { 
      id: 'SOL-2024-004', 
      item: 'Roteador Wi-Fi 6 Mesh', 
      quantity: 3, 
      unit: 'UN', 
      requester: 'Carlos Silva', 
      department: 'Técnico', 
      status: 'Comprado', 
      priority: 'Média', 
      date: '2024-03-15', 
      estimatedValue: 1800.00 
    },
  ];

  const getStatusBadge = (status: PurchaseRequest['status']) => {
    switch (status) {
      case 'Pendente': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pendente</Badge>;
      case 'Cotando': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Cotando</Badge>;
      case 'Aprovado': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Aprovado</Badge>;
      case 'Comprado': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Comprado</Badge>;
      case 'Cancelado': return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: PurchaseRequest['priority']) => {
    switch (priority) {
      case 'Urgente': return <Badge className="bg-rose-600">Urgente</Badge>;
      case 'Alta': return <Badge variant="destructive">Alta</Badge>;
      case 'Média': return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Média</Badge>;
      default: return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Solicitações de Compra</h2>
          <p className="text-zinc-500">Controle de requisições de materiais e suprimentos.</p>
        </div>
        {can('create_purchase_requests') && (
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" /> Nova Solicitação
          </Button>
        )}
      </div>

      <PurchaseRequestForm 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onSuccess={() => {
          // Refresh list
        }} 
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">8</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Em Cotação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Aprovadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">5</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Total (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 45.200</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input 
            placeholder="Buscar por item, solicitante ou ID..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" /> Filtros
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-b">
                <tr>
                  <th className="px-6 py-3 font-bold">Solicitação / Data</th>
                  <th className="px-6 py-3 font-bold">Item / Qtd</th>
                  <th className="px-6 py-3 font-bold">Solicitante / Setor</th>
                  <th className="px-6 py-3 font-bold">Prioridade</th>
                  <th className="px-6 py-3 font-bold">Status</th>
                  <th className="px-6 py-3 font-bold text-right">Valor Est.</th>
                  <th className="px-6 py-3 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-blue-600">{req.id}</span>
                        <span className="text-[10px] text-zinc-400">{new Date(req.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{req.item}</span>
                        <span className="text-xs text-zinc-500">{req.quantity} {req.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{req.requester}</span>
                        <span className="text-[10px] text-zinc-400 uppercase">{req.department}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getPriorityBadge(req.priority)}</td>
                    <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                    <td className="px-6 py-4 text-right font-bold">
                      {req.estimatedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {can('approve_purchase_requests') && (
                            <DropdownMenuItem className="gap-2"><CheckCircle2 className="h-4 w-4" /> Aprovar</DropdownMenuItem>
                          )}
                          {can('create_purchase_orders') && (
                            <DropdownMenuItem className="gap-2"><DollarSign className="h-4 w-4" /> Iniciar Cotação</DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="gap-2"><FileText className="h-4 w-4" /> Ver Detalhes</DropdownMenuItem>
                          {can('approve_purchase_requests') && (
                            <DropdownMenuItem className="gap-2 text-rose-600"><AlertCircle className="h-4 w-4" /> Cancelar</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
