import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Wrench,
  User,
  Calendar,
  Filter,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DocumentPrintModal } from '@/modules/reports/components/DocumentPrintModal';
import { ServiceOrderForm } from './ServiceOrderForm';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { usePrivacy, PrivacyMask } from '@/context/PrivacyContext';
import { ShareMenu } from "@/components/shared/ShareMenu";
import { 
  Printer, 
  Download, 
  Upload, 
  CheckSquare, 
  Square,
  Trash2,
  ChevronDown,
  Lock
} from 'lucide-react';

export function ServiceOrderList() {
  const { role, can } = usePermissions();
  const { showSensitiveData } = usePrivacy();
  const [searchTerm, setSearchTerm] = useState('');
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showMyOrdersOnly, setShowMyOrdersOnly] = useState(role === 'tech');

  if (!can('view_service_orders')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar as ordens de serviço.</p>
        </div>
      </div>
    );
  }

  const orders = [
    { 
      id: 'OS-2024-001', 
      customer: 'Hospital Santa Maria', 
      equipment: 'Raio-X Digital XP', 
      status: 'Diagnóstico', 
      priority: 'Alta',
      date: '2024-03-20',
      technician: 'Carlos Silva'
    },
    { 
      id: 'OS-2024-002', 
      customer: 'Clínica Sorriso', 
      equipment: 'Cadeira Odontológica G3', 
      status: 'Aguardando Peça', 
      priority: 'Média',
      date: '2024-03-18',
      technician: 'Ana Oliveira'
    },
    { 
      id: 'OS-2024-003', 
      customer: 'Laboratório BioAnálise', 
      equipment: 'Centrífuga Industrial', 
      status: 'Execução', 
      priority: 'Urgente',
      date: '2024-03-21',
      technician: 'Marcos Santos'
    },
    { 
      id: 'OS-2024-004', 
      customer: 'Prefeitura de São Paulo', 
      equipment: 'Monitor Multiparamétrico', 
      status: 'Finalizado', 
      priority: 'Baixa',
      date: '2024-03-15',
      technician: 'Carlos Silva'
    },
  ];

  // Mock current user name for filtering
  const currentUserName = 'Carlos Silva'; 

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.equipment.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTechnician = showMyOrdersOnly ? order.technician === currentUserName : true;

    return matchesSearch && matchesTechnician;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Diagnóstico': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Diagnóstico</Badge>;
      case 'Aguardando Peça': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Aguardando Peça</Badge>;
      case 'Execução': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Execução</Badge>;
      case 'Finalizado': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Finalizado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
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
          <h2 className="text-3xl font-bold tracking-tight">Ordens de Serviço</h2>
          <p className="text-zinc-500">Gerencie o fluxo técnico e manutenções de equipamentos.</p>
        </div>
        <div className="flex items-center gap-2">
          {role === 'tech' && (
            <Button 
              variant={showMyOrdersOnly ? "default" : "outline"}
              onClick={() => setShowMyOrdersOnly(!showMyOrdersOnly)}
              className="gap-2"
            >
              <User className="h-4 w-4" /> Meus Atendimentos
            </Button>
          )}
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" /> Importar
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Exportar
          </Button>
          {can('edit_service_orders') && (
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => {
              setSelectedOrder(null);
              setIsFormOpen(true);
            }}>
              <Plus className="h-4 w-4" /> Nova O.S.
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Em Aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Aguardando Peça</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">5</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Em Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">8</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">SLA Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">4.2 dias</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar por O.S., cliente ou equipamento..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {selectedRows.length > 0 && (
          <>
            <ShareMenu 
              data={filteredOrders.filter(o => selectedRows.includes(o.id))} 
              type="os" 
              label={`Compartilhar (${selectedRows.length})`} 
              variant="secondary"
              className="animate-in fade-in slide-in-from-left-2 gap-2"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="gap-2 animate-in fade-in slide-in-from-left-2">
                  Ações em Massa ({selectedRows.length}) <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2"><Printer className="h-4 w-4" /> Imprimir Selecionados</DropdownMenuItem>
              <DropdownMenuItem className="gap-2"><ArrowRight className="h-4 w-4" /> Mudar Status</DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-rose-600"><Trash2 className="h-4 w-4" /> Excluir Selecionados</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </>
        )}
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" /> Filtros Avançados
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-b">
                <tr>
                  <th className="px-6 py-3 w-10">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4"
                      onClick={() => {
                        if (selectedRows.length === filteredOrders.length) setSelectedRows([]);
                        else setSelectedRows(filteredOrders.map(o => o.id));
                      }}
                    >
                      {selectedRows.length === filteredOrders.length && filteredOrders.length > 0 ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
                    </Button>
                  </th>
                  <th className="px-6 py-3 font-bold">O.S. / Data</th>
                  <th className="px-6 py-3 font-bold">Cliente / Equipamento</th>
                  <th className="px-6 py-3 font-bold">Técnico</th>
                  <th className="px-6 py-3 font-bold">Prioridade</th>
                  <th className="px-6 py-3 font-bold">Status</th>
                  <th className="px-6 py-3 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                      Nenhuma ordem de serviço encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className={cn(
                      "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors",
                      selectedRows.includes(order.id) && "bg-blue-50/50 dark:bg-blue-900/10"
                    )}>
                      <td className="px-6 py-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4"
                          onClick={() => {
                            if (selectedRows.includes(order.id)) setSelectedRows(selectedRows.filter(id => id !== order.id));
                            else setSelectedRows([...selectedRows, order.id]);
                          }}
                        >
                          {selectedRows.includes(order.id) ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
                        </Button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-blue-600">{order.id}</span>
                          <span className="text-[10px] text-zinc-400">{format(new Date(order.date), 'dd/MM/yyyy')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{order.customer}</span>
                          <span className="text-xs text-zinc-500">{order.equipment}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center">
                            <User className="h-3 w-3 text-zinc-500" />
                          </div>
                          <span className="text-xs">{order.technician}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getPriorityBadge(order.priority)}</td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <ShareMenu data={order} type="os" size="icon" variant="ghost" className="h-8 w-8 text-zinc-500" />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-500"
                            title="Imprimir Documentos"
                            onClick={() => {
                              setSelectedOrder(order);
                              setPrintModalOpen(true);
                            }}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-blue-600"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsFormOpen(true);
                            }}
                          >
                            Detalhes
                          </Button>
                          {can('edit_service_orders') && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="gap-2">
                                  <Wrench className="h-4 w-4" /> Iniciar Reparo
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2">
                                  <ClipboardList className="h-4 w-4" /> Laudo Técnico
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="gap-2 text-emerald-600"
                                  onClick={() => toast.success(`OS ${order.id} finalizada! Peças baixadas do estoque.`)}
                                >
                                  <CheckCircle2 className="h-4 w-4" /> Finalizar e Baixar Estoque
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedOrder && (
        <DocumentPrintModal 
          open={printModalOpen}
          onOpenChange={setPrintModalOpen}
          entityId={selectedOrder.id}
          entityName={selectedOrder.customer}
          type="os"
        />
      )}

      <ServiceOrderForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        order={selectedOrder}
      />
    </div>
  );
}
