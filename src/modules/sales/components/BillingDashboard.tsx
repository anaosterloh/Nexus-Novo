import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search, 
  FileText, 
  Link, 
  Paperclip, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Filter,
  ArrowUpRight,
  MoreVertical,
  Download,
  Eye
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

interface BillingNote {
  id: string;
  orderId: string;
  customer: string;
  value: number;
  issueDate: string;
  accessKey: string;
  status: 'Processado' | 'Pendente' | 'Erro';
  hasAttachment: boolean;
}

export function BillingDashboard() {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!can('view_financials')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar o painel de faturamento.</p>
        </div>
      </div>
    );
  }

  const notes: BillingNote[] = [
    { 
      id: 'NF-1024', 
      orderId: 'PED-550', 
      customer: 'Hospital Santa Maria', 
      value: 15200.00, 
      issueDate: '2024-03-20', 
      accessKey: '35240300123456789012345678901234567890123456', 
      status: 'Processado', 
      hasAttachment: true 
    },
    { 
      id: 'NF-1025', 
      orderId: 'PED-552', 
      customer: 'Clínica Sorriso', 
      value: 2450.00, 
      issueDate: '2024-03-21', 
      accessKey: '35240300987654321098765432109876543210987654', 
      status: 'Pendente', 
      hasAttachment: false 
    },
    { 
      id: 'NF-1026', 
      orderId: 'PED-555', 
      customer: 'Laboratório BioAnálise', 
      value: 8900.00, 
      issueDate: '2024-03-22', 
      accessKey: '35240311223344556677889900112233445566778899', 
      status: 'Processado', 
      hasAttachment: true 
    },
  ];

  const handleLaunchNote = () => {
    toast.success('Nota lançada com sucesso para rastreabilidade!');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Faturamento e Notas</h2>
          <p className="text-zinc-500">Lançamento de notas fiscais para rastreabilidade e controle financeiro.</p>
        </div>
        {can('edit_financials') && (
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" /> Lançar Nota (Entrada/Saída)
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-600">Total Faturado (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">R$ 245.800,00</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-600">Notas Processadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">42</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-600">Aguardando Anexo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">5</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input 
            placeholder="Buscar por número da nota, cliente ou chave de acesso..." 
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
                  <th className="px-6 py-3 font-bold">Nota / Data</th>
                  <th className="px-6 py-3 font-bold">Pedido Origem</th>
                  <th className="px-6 py-3 font-bold">Cliente / Fornecedor</th>
                  <th className="px-6 py-3 font-bold">Chave de Acesso</th>
                  <th className="px-6 py-3 font-bold text-right">Valor</th>
                  <th className="px-6 py-3 font-bold">Status</th>
                  <th className="px-6 py-3 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {notes.map((note) => (
                  <tr key={note.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-emerald-600">{note.id}</span>
                        <span className="text-[10px] text-zinc-400">{new Date(note.issueDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-[10px] font-mono">{note.orderId}</Badge>
                    </td>
                    <td className="px-6 py-4 font-medium">{note.customer}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 group">
                        <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[150px]">{note.accessKey}</span>
                        <Link className="h-3 w-3 text-zinc-300 group-hover:text-blue-500 cursor-pointer" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      {note.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "text-[10px] font-bold",
                        note.status === 'Processado' ? 'bg-emerald-500' : 'bg-amber-500'
                      )}>
                        {note.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {note.hasAttachment ? (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" title="Ver Anexo">
                            <Eye className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" title="Anexar XML/PDF">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2"><Download className="h-4 w-4" /> Baixar XML</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2"><FileText className="h-4 w-4" /> Ver Detalhes</DropdownMenuItem>
                            {can('edit_financials') && (
                              <DropdownMenuItem className="gap-2 text-rose-600"><AlertCircle className="h-4 w-4" /> Estornar</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Lançamento de Nota Fiscal</DialogTitle>
            <DialogDescription>Insira os dados da nota para rastreabilidade. O sistema não realiza emissão.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="noteNumber">Número da Nota</Label>
                <Input id="noteNumber" placeholder="Ex: 1024" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="orderRef">Pedido de Origem</Label>
                <Input id="orderRef" placeholder="Ex: PED-550" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accessKey">Chave de Acesso (44 dígitos)</Label>
              <Input id="accessKey" placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="value">Valor Total</Label>
                <Input id="value" type="number" placeholder="0,00" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Data de Emissão</Label>
                <Input id="date" type="date" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Label>Anexo da Nota (XML ou PDF)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 transition-colors cursor-pointer">
                <Paperclip className="h-8 w-8 text-zinc-400 mb-2" />
                <p className="text-xs text-zinc-500 font-medium">Clique para selecionar ou arraste o arquivo</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleLaunchNote}>Confirmar Lançamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
