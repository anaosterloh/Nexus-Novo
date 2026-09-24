import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  Printer,
  FileText,
  ArrowRight,
  MoreHorizontal,
  Package,
  Scan,
  AlertTriangle
} from 'lucide-react';
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
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const sales = [
  { id: '1', nf: '001.245', date: '26/02/2024', client: 'Nexus Tecnologia LTDA', value: 'R$ 1.250,00', status: 'conferido', items: 5 },
  { id: '2', nf: '001.246', date: '26/02/2024', client: 'João Silva ME', value: 'R$ 450,00', status: 'pendente', items: 2 },
  { id: '3', nf: '001.247', date: '25/02/2024', client: 'Supermercado Alvorada', value: 'R$ 3.800,00', status: 'conferido', items: 12 },
  { id: '4', nf: '001.248', date: '25/02/2024', client: 'Oficina do Zé', value: 'R$ 120,00', status: 'divergente', items: 1 },
  { id: '5', nf: '001.249', date: '24/02/2024', client: 'Condomínio Solar', value: 'R$ 980,00', status: 'conferido', items: 4 },
];

export function SalesConference() {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nfeInput, setNfeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleStartConference = () => {
    if (!nfeInput) {
      toast.error('Informe o número da NF-e ou Chave de Acesso');
      return;
    }
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      toast.success('NF-e localizada! Iniciando conferência de itens...');
      setIsModalOpen(false);
    }, 1500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'conferido':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Conferido</Badge>;
      case 'pendente':
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'divergente':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Divergente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Conferência de Vendas</h2>
          <p className="text-muted-foreground">Valide a saída de mercadorias e documentos fiscais.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" /> Imprimir Lista
          </Button>
          {(can('edit_sales') || can('edit_logistics')) && (
            <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => setIsModalOpen(true)}>
              Nova Conferência
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Buscar por NF, Cliente ou Data..." 
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-900 border-b text-zinc-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">NF-e</th>
                  <th className="px-6 py-4">Emissão</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Itens</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4">{getStatusBadge(sale.status)}</td>
                    <td className="px-6 py-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">{sale.nf}</td>
                    <td className="px-6 py-4 text-zinc-500">{sale.date}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{sale.client}</div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{sale.items} itens</td>
                    <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-zinc-100">{sale.value}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <FileText className="h-4 w-4" /> Ver DANFE
                            </DropdownMenuItem>
                            {(can('edit_sales') || can('edit_logistics')) && (
                              <>
                                <DropdownMenuItem className="gap-2">
                                  <ArrowRight className="h-4 w-4" /> Iniciar Conferência
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-red-600">
                                  <AlertCircle className="h-4 w-4" /> Marcar Divergência
                                </DropdownMenuItem>
                              </>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-emerald-700 dark:text-emerald-400">Conferidos Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">12</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-zinc-500">Aguardando Conferência</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">05</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-red-700 dark:text-red-400">Divergências</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">01</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-emerald-600" />
              Iniciar Nova Conferência
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Número da NF-e ou Chave de Acesso</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Digite ou use o leitor de código de barras" 
                  value={nfeInput}
                  onChange={(e) => setNfeInput(e.target.value)}
                  className="font-mono"
                />
                <Button variant="outline" size="icon">
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase font-black text-zinc-400 tracking-widest">Últimas Notas Fiscais Emitidas</h4>
              <div className="space-y-2">
                {[
                  { nf: '001.250', client: 'Hospital Santa Maria', value: 'R$ 12.400,00' },
                  { nf: '001.251', client: 'Clínica São Lucas', value: 'R$ 3.150,00' }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-2 rounded border border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors"
                    onClick={() => setNfeInput(item.nf)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-zinc-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{item.nf}</p>
                        <p className="text-[10px] text-zinc-500">{item.client}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-emerald-600">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
              <p className="text-[10px] text-blue-700">A conferência garante que os itens físicos correspondam exatamente ao que foi faturado na NF-e, evitando erros de expedição.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700" 
              onClick={handleStartConference}
              disabled={isScanning}
            >
              {isScanning ? 'Localizando...' : 'Iniciar Conferência'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
