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
  ArrowDownCircle,
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

const mockPayables = [
  { id: '1', description: 'Fornecedor de Peças XYZ', category: 'Insumos', amount: 4500.00, dueDate: '2024-03-25', status: 'pending', priority: 'high' },
  { id: '2', description: 'Aluguel Galpão Sul', category: 'Infraestrutura', amount: 12000.00, dueDate: '2024-03-20', status: 'overdue', priority: 'high' },
  { id: '3', description: 'Energia Elétrica - Sede', category: 'Utilidades', amount: 850.40, dueDate: '2024-03-28', status: 'pending', priority: 'medium' },
  { id: '4', description: 'Serviços de Limpeza', category: 'Serviços', amount: 1500.00, dueDate: '2024-03-15', status: 'paid', priority: 'low' },
  { id: '5', description: 'Internet e Telefonia', category: 'Utilidades', amount: 420.00, dueDate: '2024-03-22', status: 'pending', priority: 'medium' },
];

export function AccountsPayable() {
  const { can } = usePermissions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [payables, setPayables] = useState(mockPayables);

  if (!can('view_financials')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar contas a pagar.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const checkIntegrations = () => {
      const newPayableStr = localStorage.getItem('nexus_new_payable');
      if (newPayableStr) {
        const newPayable = JSON.parse(newPayableStr);
        // Check if already exists to avoid duplicates on re-render
        if (!payables.some(p => p.id === newPayable.id)) {
          setPayables(prev => [newPayable, ...prev]);
          toast.success('Nova conta a pagar integrada do Estoque!');
          localStorage.removeItem('nexus_new_payable');
        }
      }
    };

    checkIntegrations();
    // Optional: interval to check periodically if user switches tabs
    const interval = setInterval(checkIntegrations, 2000);
    return () => clearInterval(interval);
  }, [payables]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1"><CheckCircle2 className="h-3 w-3" /> Pago</Badge>;
      case 'pending': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'overdue': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 gap-1"><AlertCircle className="h-3 w-3" /> Vencido</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contas a Pagar</h2>
          <p className="text-muted-foreground">Gerencie suas obrigações financeiras e pagamentos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          {can('edit_financials') && (
            <Button className="bg-rose-600 hover:bg-rose-700 gap-2" onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4" /> Novo Pagamento
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-rose-50/50 border-rose-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-rose-600">Total a Pagar (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-700">R$ 45.280,00</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-amber-600">Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-700">R$ 12.450,00</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-blue-600">Vence Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">R$ 3.200,00</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-emerald-600">Pagos (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">R$ 28.900,00</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Buscar por fornecedor, descrição ou categoria..." 
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
                <TableHead className="text-[10px] uppercase font-bold">Descrição / Fornecedor</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Categoria</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Valor</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center">Status</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payables.map((item) => (
                <TableRow key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={cn(
                        "font-bold",
                        item.status === 'overdue' ? "text-rose-600" : "text-zinc-900"
                      )}>
                        {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[10px] text-zinc-500">Vence em 5 dias</span>
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
                  <TableCell className="text-right font-bold text-rose-600">
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
                            setSelectedPayable(item);
                            setIsTrackingModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" /> Acompanhar Pagamento
                        </DropdownMenuItem>
                        {can('edit_financials') && (
                          <DropdownMenuItem className="gap-2"><CheckCircle2 className="h-4 w-4" /> Baixar Pagamento</DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="gap-2"><FileText className="h-4 w-4" /> Ver Comprovante</DropdownMenuItem>
                        {can('edit_financials') && (
                          <DropdownMenuItem className="gap-2"><ArrowDownCircle className="h-4 w-4" /> Estornar</DropdownMenuItem>
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

      {selectedPayable && (
        <PaymentTrackingModal
          open={isTrackingModalOpen}
          onOpenChange={setIsTrackingModalOpen}
          title={`ROTEIRO #${selectedPayable.id.padStart(6, '0')}`}
          totalAmount={selectedPayable.amount}
          installments={[
            { id: '1', date: '22/12/2025', amount: selectedPayable.amount * 0.4, status: 'paid', receiptUrl: '#' },
            { id: '2', date: '22/12/2025', amount: selectedPayable.amount * 0.4, status: 'paid', receiptUrl: '#' },
            { id: '3', date: '29/12/2025', amount: selectedPayable.amount * 0.2, status: 'pending', receiptUrl: '#' },
          ]}
        />
      )}
    </div>
  );
}
