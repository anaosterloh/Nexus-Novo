import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Filter, 
  FileText, 
  Truck, 
  Calendar, 
  MoreHorizontal, 
  Eye, 
  CheckCircle2,
  Clock,
  PackagePlus,
  ArrowUpRight,
  ShoppingBag,
  Lock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

import { StockEntryForm } from './StockEntryForm';

const mockEntries = [
  { id: '1', nfe: '001.542', date: '26/02/2024', supplier: 'Eletrônica Global S/A', value: 'R$ 15.400,00', status: 'Concluído', items: 12, type: 'Compra' },
  { id: '2', nfe: '003.891', date: '26/02/2024', supplier: 'Metalúrgica São José', value: 'R$ 4.250,00', status: 'Processando', items: 5, type: 'Compra' },
  { id: '3', nfe: '000.125', date: '25/02/2024', supplier: 'Nexus Importadora', value: 'R$ 45.000,00', status: 'Concluído', items: 2, type: 'Importação' },
  { id: '4', nfe: '002.441', date: '24/02/2024', supplier: 'Logística Express', value: 'R$ 1.200,00', status: 'Concluído', items: 1, type: 'Devolução' },
  { id: '5', nfe: '001.543', date: '24/02/2024', supplier: 'Eletrônica Global S/A', value: 'R$ 8.900,00', status: 'Aguardando', items: 8, type: 'Compra' },
];

export function StockEntries() {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);

  const [entries, setEntries] = useState(mockEntries);

  if (!can('view_stock')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar entradas de estoque.</p>
        </div>
      </div>
    );
  }

  const handleImportPurchaseOrder = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Buscando pedidos confirmados...',
        success: () => {
          const newEntry = { 
            id: '6', 
            nfe: 'PENDENTE', 
            date: new Date().toLocaleDateString('pt-BR'), 
            supplier: 'Fornecedor Exemplo Ltda', 
            value: 'R$ 12.500,00', 
            status: 'Aguardando', 
            items: 15, 
            type: 'Compra' 
          };
          setEntries([newEntry, ...entries]);
          return 'Pedido #1024 importado com sucesso! Aguardando conferência.';
        },
        error: 'Erro ao importar pedido',
      }
    );
  };

  const handleFinalizeEntry = (id: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Atualizando estoque e gerando financeiro...',
        success: () => {
          setEntries(entries.map(e => e.id === id ? { ...e, status: 'Concluído' } : e));
          
          // Simulate integration with Finance Module
          const newPayable = {
            id: `INT-${Date.now()}`,
            description: 'Fornecedor Exemplo Ltda - NF 1024',
            category: 'Insumos',
            amount: 12500.00,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
            status: 'pending',
            priority: 'medium'
          };
          localStorage.setItem('nexus_new_payable', JSON.stringify(newPayable));
          
          return 'Entrada concluída! Estoque atualizado e conta a pagar gerada.';
        },
        error: 'Erro ao finalizar entrada',
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Entradas de Mercadoria (NF-e)</h2>
          <p className="text-muted-foreground">Gerencie o recebimento de produtos e a atualização automática do estoque via XML ou manual.</p>
        </div>
        {can('edit_stock') && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleImportPurchaseOrder}>
              <ShoppingBag className="mr-2 h-4 w-4" /> Importar Pedido
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEntryFormOpen(true)}>
              <FileText className="mr-2 h-4 w-4" /> Importar XML
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => setIsEntryFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Entrada Manual
            </Button>
          </div>
        )}
      </div>

      <StockEntryForm 
        open={isEntryFormOpen} 
        onOpenChange={setIsEntryFormOpen} 
        onSuccess={() => {}} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] uppercase text-emerald-600">Entradas Hoje</CardTitle>
            <PackagePlus className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">08</p>
            <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> +2 em relação a ontem
            </p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] uppercase text-amber-600">Aguardando Conferência</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-700">03</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] uppercase text-blue-600">Valor Total (Mês)</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">R$ 245.800,00</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Buscar por NF-e, fornecedor ou data..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead className="text-[10px] uppercase font-bold">Status</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">NF-e</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Emissão</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Fornecedor</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center">Itens</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Valor Total</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Tipo</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-zinc-50/50 transition-colors">
                  <TableCell>
                    {entry.status === 'Concluído' ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Concluído
                      </Badge>
                    ) : entry.status === 'Processando' ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                        <Clock className="h-3 w-3 animate-pulse" /> Processando
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                        <Clock className="h-3 w-3" /> Aguardando
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-zinc-900">{entry.nfe}</TableCell>
                  <TableCell className="text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {entry.date}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Truck className="h-3 w-3 text-zinc-400" />
                      <span className="font-medium">{entry.supplier}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-zinc-500">{entry.items}</TableCell>
                  <TableCell className="text-right font-bold text-zinc-900">{entry.value}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[9px] uppercase">{entry.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> Detalhes</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2"><FileText className="h-4 w-4" /> Ver XML</DropdownMenuItem>
                        {can('edit_stock') && (
                          <DropdownMenuItem 
                            className="gap-2 text-emerald-600"
                            onClick={() => handleFinalizeEntry(entry.id)}
                            disabled={entry.status === 'Concluído'}
                          >
                            <CheckCircle2 className="h-4 w-4" /> Finalizar Entrada
                          </DropdownMenuItem>
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
    </div>
  );
}
