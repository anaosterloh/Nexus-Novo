import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  ArrowUpCircle,
  MoreVertical,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { FinanceEntryForm } from './FinanceEntryForm';
import { PaymentTrackingModal } from './PaymentTrackingModal';
import { cn } from '@/lib/utils';

const mockReceivables = [
  { id: '1', description: 'Venda de Equipamento - Hospital Santa Maria', category: 'Vendas', amount: 45000.00, dueDate: '2024-03-25', status: 'pending', priority: 'high' },
  { id: '2', description: 'Serviço de Manutenção - Clínica São José', category: 'Serviços', amount: 1200.00, dueDate: '2024-03-20', status: 'overdue', priority: 'high' },
  { id: '3', description: 'Venda de Peças - Distribuidora Global', category: 'Vendas', amount: 8500.40, dueDate: '2024-03-28', status: 'pending', priority: 'medium' },
  { id: '4', description: 'Consultoria Técnica - LabTech', category: 'Serviços', amount: 1500.00, dueDate: '2024-03-15', status: 'paid', priority: 'low' },
  { id: '5', description: 'Locação de Equipamento - BioMed', category: 'Locação', amount: 4200.00, dueDate: '2024-03-22', status: 'pending', priority: 'medium' },
];

export function AccountsReceivable() {
  const { can } = usePermissions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [receivables, setReceivables] = useState(mockReceivables);

  if (!can('view_financials')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar contas a receber.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const checkIntegrations = () => {
      const newReceivableStr = localStorage.getItem('nexus_new_receivable');
      if (newReceivableStr) {
        const newReceivable = JSON.parse(newReceivableStr);
        if (!receivables.some(r => r.id === newReceivable.id)) {
          setReceivables(prev => [newReceivable, ...prev]);
          toast.success('Novo recebível integrado de Vendas!');
          localStorage.removeItem('nexus_new_receivable');
        }
      }
    };

    checkIntegrations();
    const interval = setInterval(checkIntegrations, 2000);
    return () => clearInterval(interval);
  }, [receivables]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1"><CheckCircle2 className="h-3 w-3" /> Recebido</Badge>;
      case 'pending': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'overdue': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 gap-1"><AlertCircle className="h-3 w-3" /> Vencido</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contas a Receber</h2>
          <p className="text-muted-foreground">Monitore suas receitas e recebimentos de clientes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          {can('edit_financials') && (
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4" /> Nova Receita
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-emerald-600">Total a Receber (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">R$ 125.450,00</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-amber-600">Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-700">R$ 8.200,00</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-blue-600">Receber Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">R$ 15.800,00</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-emerald-600">Recebidos (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">R$ 92.400,00</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Buscar por cliente, descrição ou categoria..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" /> Período
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead className="text-[10px] uppercase font-bold">Vencimento</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Descrição / Cliente</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Categoria</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Valor</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center">Status</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receivables.map((item) => (
                <TableRow key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={cn(
                        "font-bold",
                        item.status === 'overdue' ? "text-rose-600" : "text-zinc-900"
                      )}>
                        {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[10px] text-zinc-500">Vence em 3 dias</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-900">{item.description}</span>
                      <span className="text-[10px] text-zinc-500">ID: #{item.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-600">
                    R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="gap-2"
                          onClick={() => {
                            setSelectedReceivable(item);
                            setIsTrackingModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" /> Acompanhar Pagamento
                        </DropdownMenuItem>
                        {can('edit_financials') && (
                          <DropdownMenuItem className="gap-2"><CheckCircle2 className="h-4 w-4" /> Baixar Recebimento</DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="gap-2"><FileText className="h-4 w-4" /> Ver Nota Fiscal</DropdownMenuItem>
                        {can('edit_financials') && (
                          <DropdownMenuItem className="gap-2"><ArrowUpCircle className="h-4 w-4" /> Estornar</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FinanceEntryForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSuccess={() => {}} 
      />

      {selectedReceivable && (
        <PaymentTrackingModal
          open={isTrackingModalOpen}
          onOpenChange={setIsTrackingModalOpen}
          title={`ROTEIRO #${selectedReceivable.id.padStart(6, '0')}`}
          totalAmount={selectedReceivable.amount}
          installments={[
            { id: '1', date: '22/12/2025', amount: selectedReceivable.amount * 0.4, status: 'paid', receiptUrl: '#' },
            { id: '2', date: '22/12/2025', amount: selectedReceivable.amount * 0.4, status: 'paid', receiptUrl: '#' },
            { id: '3', date: '29/12/2025', amount: selectedReceivable.amount * 0.2, status: 'pending', receiptUrl: '#' },
          ]}
        />
      )}
    </div>
  );
}
