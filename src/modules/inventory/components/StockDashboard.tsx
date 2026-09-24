import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  History,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Lock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';

export function StockDashboard() {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  if (!can('view_stock')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar o dashboard de estoque.</p>
        </div>
      </div>
    );
  }

  const stats = [
    { title: 'Total de Itens', value: '1,245', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Estoque Baixo', value: '24', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Vencendo (30d)', value: '12', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: 'Giro Médio', value: '4.2x', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const lowStockItems = [
    { id: '1', name: 'Válvula Hidráulica V-200', sku: 'VAL-001', current: 5, min: 10, unit: 'UN' },
    { id: '2', name: 'Sensor de Proximidade S-50', sku: 'SEN-050', current: 2, min: 15, unit: 'UN' },
    { id: '3', name: 'Cabo de Aço 10mm', sku: 'CAB-010', current: 45, min: 100, unit: 'MT' },
    { id: '4', name: 'Graxa Industrial XP', sku: 'GRX-001', current: 3, min: 20, unit: 'KG' },
  ];

  const expiringItems = [
    { id: '5', name: 'Reagente Químico A-1', batch: 'L2024-01', expiry: '15/03/2024', daysLeft: 16 },
    { id: '6', name: 'Filtro de Ar Especial', batch: 'F-998', expiry: '22/03/2024', daysLeft: 23 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Estoque</h2>
          <p className="text-zinc-500">Visão estratégica de inventário, giros e alertas críticos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <History className="h-4 w-4" /> Histórico de Movimentações
          </Button>
          {can('edit_stock') && (
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              Inventário Geral
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">{stat.title}</CardTitle>
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Giro de Estoque por Categoria</CardTitle>
            <CardDescription>Frequência de saída de produtos nos últimos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] min-h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Válvulas', giro: 5.2 },
                  { name: 'Sensores', giro: 3.8 },
                  { name: 'Cabos', giro: 2.5 },
                  { name: 'Químicos', giro: 6.1 },
                  { name: 'Motores', giro: 1.9 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" strokeOpacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="giro" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Estoque Crítico
            </CardTitle>
            <CardDescription>Itens abaixo do estoque mínimo.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {lowStockItems.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="text-[10px] text-zinc-500">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-rose-600">{item.current} / {item.min}</p>
                    <p className="text-[10px] text-zinc-400">{item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              {can('edit_stock') && (
                <Button variant="outline" className="w-full text-xs h-8">Gerar Pedidos de Compra</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-rose-500" />
              Alertas de Validade
            </CardTitle>
            <CardDescription>Produtos próximos ao vencimento.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {expiringItems.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="text-[10px] text-zinc-500">Lote: {item.batch}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-rose-600">{item.expiry}</p>
                    <p className="text-[10px] text-zinc-400">{item.daysLeft} dias restantes</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <Button variant="outline" className="w-full text-xs h-8">Ver Todos os Lotes</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Valorização de Estoque (Mensal)</CardTitle>
            <CardDescription>Evolução do valor total investido em mercadorias.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] min-h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { month: 'Set', value: 450000 },
                  { month: 'Out', value: 480000 },
                  { month: 'Nov', value: 465000 },
                  { month: 'Dez', value: 520000 },
                  { month: 'Jan', value: 510000 },
                  { month: 'Fev', value: 545000 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" strokeOpacity={0.2} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(val) => `R$ ${val/1000}k`} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
