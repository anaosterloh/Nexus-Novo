import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Warehouse, 
  ArrowRightLeft, 
  AlertTriangle,
  Download,
  History,
  Package
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

const mockStock = [
  { id: '1', code: 'PRD-001', name: 'Placa Mãe Industrial v3', category: 'Eletrônicos', balance: 45, unit: 'UN', minStock: 10, location: 'A1-04', value: 'R$ 12.450,00' },
  { id: '2', code: 'PRD-002', name: 'Sensor de Pressão 500bar', category: 'Sensores', balance: 8, unit: 'PC', minStock: 15, location: 'B2-12', value: 'R$ 3.200,00' },
  { id: '3', code: 'PRD-003', name: 'Cabo Blindado 4 vias (m)', category: 'Cabos', balance: 1250, unit: 'MT', minStock: 500, location: 'C1-01', value: 'R$ 8.750,00' },
  { id: '4', code: 'PRD-004', name: 'Fonte Chaveada 24V 10A', category: 'Energia', balance: 2, unit: 'UN', minStock: 5, location: 'A2-08', value: 'R$ 450,00' },
  { id: '5', code: 'PRD-005', name: 'Gabinete Metálico Rack 19', category: 'Estrutura', balance: 12, unit: 'UN', minStock: 10, location: 'D1-05', value: 'R$ 5.400,00' },
];

export function StockBalance() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Consulta de Saldo</h2>
          <p className="text-muted-foreground">Visualize a posição atual do estoque em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button variant="outline" size="sm">
            <History className="mr-2 h-4 w-4" /> Histórico Geral
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-zinc-500">Total de Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">1.250</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-emerald-600">Valor em Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">R$ 452.800,00</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-amber-600">Abaixo do Mínimo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-700">14</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase text-blue-600">Movimentações (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">842</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Buscar por código, nome ou localização..." 
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
                <TableHead className="text-[10px] uppercase font-bold">Produto</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Categoria</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center">Saldo Atual</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center">Unid.</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center">Mínimo</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Localização</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Valor Est.</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStock.map((item) => (
                <TableRow key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-900">{item.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500">{item.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold ${item.balance < item.minStock ? 'text-red-600' : 'text-zinc-900'}`}>
                      {item.balance}
                    </span>
                    {item.balance < item.minStock && (
                      <AlertTriangle className="h-3 w-3 text-red-600 inline ml-1" />
                    )}
                  </TableCell>
                  <TableCell className="text-center text-zinc-500">{item.unit}</TableCell>
                  <TableCell className="text-center text-zinc-500">{item.minStock}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-zinc-600">
                      <Warehouse className="h-3 w-3" />
                      {item.location}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-zinc-600">{item.value}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver Movimentações">
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Detalhes do Produto">
                        <Package className="h-4 w-4" />
                      </Button>
                    </div>
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
