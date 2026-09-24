import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Filter, 
  ClipboardCheck, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  History,
  ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

const mockInventories = [
  { id: '1', date: '26/02/2024', title: 'Inventário Geral Fevereiro', status: 'Em Aberto', responsible: 'Ricardo Oliveira', items: 1250, progress: 45 },
  { id: '2', date: '15/02/2024', title: 'Ajuste de Estoque - Sensores', status: 'Concluído', responsible: 'Ana Paula Santos', items: 15, progress: 100 },
  { id: '3', date: '01/02/2024', title: 'Inventário Geral Janeiro', status: 'Concluído', responsible: 'Marcos Vinícius', items: 1248, progress: 100 },
  { id: '4', date: '20/01/2024', title: 'Ajuste de Estoque - Cabos', status: 'Concluído', responsible: 'Juliana Costa', items: 5, progress: 100 },
];

export function StockInventory() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventário e Ajustes</h2>
          <p className="text-muted-foreground">Realize contagens periódicas e ajustes de saldo para manter a acuracidade do estoque.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <History className="mr-2 h-4 w-4" /> Histórico de Ajustes
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Novo Inventário
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-blue-600">Acuracidade do Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">98.5%</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-amber-600">Divergências Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-700">12</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-50/50 border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-zinc-500">Último Inventário Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">01/02/2024</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Buscar por título ou responsável..." 
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
                <TableHead className="text-[10px] uppercase font-bold">Data</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Título do Inventário</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Responsável</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center">Itens</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Progresso</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInventories.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                  <TableCell>
                    {inv.status === 'Concluído' ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Concluído
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                        <Clock className="h-3 w-3 animate-pulse" /> Em Aberto
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-500 text-xs">{inv.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-zinc-400" />
                      <span className="font-bold text-zinc-900">{inv.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-600 text-xs">{inv.responsible}</TableCell>
                  <TableCell className="text-center text-zinc-500">{inv.items}</TableCell>
                  <TableCell>
                    <div className="w-full bg-zinc-100 rounded-full h-1.5 max-w-[100px]">
                      <div 
                        className={`h-1.5 rounded-full ${inv.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                        style={{ width: `${inv.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1">{inv.progress}% concluído</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                      {inv.status === 'Concluído' ? 'Ver Resultados' : 'Continuar'}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-900">Atenção ao Inventário</p>
          <p className="text-xs text-amber-700">Durante o processo de inventário, as movimentações de estoque para os itens selecionados devem ser evitadas para garantir a precisão da contagem.</p>
        </div>
      </div>
    </div>
  );
}
