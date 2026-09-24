import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Download, 
  Calendar, 
  TrendingUp,
  TrendingDown,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Lock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { name: 'Jan', entries: 4000, exits: 2400, balance: 1600 },
  { name: 'Fev', entries: 3000, exits: 1398, balance: 1602 },
  { name: 'Mar', entries: 2000, exits: 9800, balance: -7800 },
  { name: 'Abr', entries: 2780, exits: 3908, balance: -1128 },
  { name: 'Mai', entries: 1890, exits: 4800, balance: -2910 },
  { name: 'Jun', entries: 2390, exits: 3800, balance: -1410 },
  { name: 'Jul', entries: 3490, exits: 4300, balance: -810 },
];

const mockTransactions = [
  { id: '1', date: '2024-03-15', description: 'Venda Equipamento X', type: 'entry', category: 'Vendas', amount: 15000.00, account: 'Banco Itaú' },
  { id: '2', date: '2024-03-14', description: 'Pagamento Fornecedor Y', type: 'exit', category: 'Insumos', amount: 4500.00, account: 'Caixa Geral' },
  { id: '3', date: '2024-03-14', description: 'Aluguel Escritório', type: 'exit', category: 'Infraestrutura', amount: 2500.00, account: 'Banco Itaú' },
  { id: '4', date: '2024-03-13', description: 'Recebimento Serviço Z', type: 'entry', category: 'Serviços', amount: 3200.00, account: 'Banco Santander' },
  { id: '5', date: '2024-03-12', description: 'Manutenção Veículo', type: 'exit', category: 'Logística', amount: 850.00, account: 'Cartão Corporativo' },
];

export function CashFlow() {
  const { can } = usePermissions();
  const [period, setPeriod] = useState('month');

  if (!can('view_financials')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar o fluxo de caixa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fluxo de Caixa</h2>
          <p className="text-muted-foreground">Acompanhe as entradas, saídas e o saldo projetado.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Relatório PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" /> Março/2024
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] uppercase text-emerald-600">Total Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">R$ 158.450,00</p>
            <p className="text-[10px] text-emerald-600 mt-1">+12% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card className="bg-rose-50/50 border-rose-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] uppercase text-rose-600">Total Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-700">R$ 92.200,00</p>
            <p className="text-[10px] text-rose-600 mt-1">-5% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 text-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] uppercase text-zinc-400">Saldo Líquido</CardTitle>
            <BarChart3 className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-400">R$ 66.250,00</p>
            <p className="text-[10px] text-zinc-400 mt-1">Disponibilidade imediata</p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-sm font-bold uppercase text-zinc-500">Evolução do Fluxo de Caixa</CardTitle>
        </CardHeader>
        <div className="h-[300px] min-h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <Tooltip />
              <Area type="monotone" dataKey="entries" stroke="#10b981" fillOpacity={1} fill="url(#colorEntries)" strokeWidth={2} />
              <Area type="monotone" dataKey="exits" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExits)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Últimas Movimentações</h3>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filtrar
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/50">
                  <TableHead className="text-[10px] uppercase font-bold">Data</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Descrição</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Categoria</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Conta</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTransactions.map((item) => (
                  <TableRow key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="text-xs font-medium">
                      {new Date(item.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.type === 'entry' ? (
                          <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-rose-500" />
                        )}
                        <span className="text-sm font-medium">{item.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">{item.account}</TableCell>
                    <TableCell className={cn(
                      "text-right font-bold",
                      item.type === 'entry' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {item.type === 'entry' ? '+' : '-'} R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
