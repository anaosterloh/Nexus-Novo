
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  FileText, 
  Printer, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { POPStatus } from '../types';
import { cn } from '@/lib/utils';

interface POP {
  id: string;
  title: string;
  category: string;
  version: string;
  status: POPStatus;
  lastReview: string;
  nextReview: string;
  author: string;
}

export function POPManager() {
  const [pops] = useState<POP[]>([
    {
      id: 'POP-ADM-001',
      title: 'Abertura de Ordem de Serviço',
      category: 'Administrativo',
      version: '2.4',
      status: 'Ativo',
      lastReview: '15/02/2024',
      nextReview: '15/02/2025',
      author: 'Ana Paula'
    },
    {
      id: 'POP-FIN-002',
      title: 'Fechamento de Caixa Diário',
      category: 'Financeiro',
      version: '1.1',
      status: 'Em Revisão',
      lastReview: '20/03/2023',
      nextReview: '20/03/2024',
      author: 'Carlos Silva'
    },
    {
      id: 'POP-LOG-003',
      title: 'Recebimento de Mercadorias',
      category: 'Logística',
      version: '3.0',
      status: 'Ativo',
      lastReview: '10/01/2024',
      nextReview: '10/01/2025',
      author: 'Roberto M.'
    },
    {
      id: 'POP-TEC-004',
      title: 'Manutenção Preventiva - Raio-X',
      category: 'Técnico',
      version: '1.0',
      status: 'Obsoleto',
      lastReview: '01/01/2022',
      nextReview: '01/01/2023',
      author: 'Ricardo O.'
    }
  ]);

  const getStatusColor = (status: POPStatus) => {
    switch (status) {
      case 'Ativo': return 'bg-emerald-500 hover:bg-emerald-600';
      case 'Em Revisão': return 'bg-amber-500 hover:bg-amber-600';
      case 'Em Elaboração': return 'bg-blue-500 hover:bg-blue-600';
      case 'Obsoleto': return 'bg-zinc-400 hover:bg-zinc-500';
      default: return 'bg-zinc-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Procedimentos Operacionais Padrão (POP)</h3>
          <p className="text-sm text-zinc-500">Gerencie os procedimentos internos, revisões e impressões controladas.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Novo Procedimento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">Categorias</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {['Todos', 'Administrativo', 'Financeiro', 'Técnico', 'Logística', 'Vendas', 'RH'].map((cat, i) => (
                <button 
                  key={cat} 
                  className={cn(
                    "w-full text-left p-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between group",
                    i === 0 && "font-medium bg-zinc-50 dark:bg-zinc-800"
                  )}
                >
                  {cat}
                  <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full">
                    {i === 0 ? pops.length : Math.floor(Math.random() * 5)}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input placeholder="Buscar procedimento por título ou código..." className="pl-10" />
            </div>
          </div>

          <div className="rounded-md border bg-white dark:bg-zinc-950">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código / Título</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Próxima Revisão</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pops.map((pop) => (
                  <TableRow key={pop.id} className="group">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-xs text-zinc-500 font-mono">{pop.id}</span>
                        <span className="font-medium">{pop.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{pop.version}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(pop.status)}>{pop.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <Clock className="h-3 w-3" />
                        {pop.nextReview}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Imprimir Cópia Controlada">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
