import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { 
  Package, 
  ShoppingCart, 
  AlertCircle, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Wrench,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Filter,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Plus,
  FileText,
  UserPlus,
  History,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useNavigate } from 'react-router-dom';
import { aiService } from '@/services/aiService';
import { DraggableDashboard } from './DraggableDashboard';
import { Sparkles } from 'lucide-react';
import { NexusWidget } from './NexusWidget';
import { PrivacyMask } from '@/context/PrivacyContext';

export function Dashboard() {
  const navigate = useNavigate();
  const { currentCompany, currentBranch, branches } = useApp();
  const { user: authUser } = useAuth();
  const { can } = usePermissions();
  const [aiInsight, setAiInsight] = useState<string>('Analisando dados do sistema para gerar insights estratégicos...');
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    pendingRequests: 0,
    totalSales: 0,
    receivables: 0,
    payables: 0,
    pendingOS: 0
  });

  const [salesData, setSalesData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (currentCompany) {
      // Mocking some data for the charts based on timeRange
      const baseValue = timeRange === '7d' ? 1000 : timeRange === '30d' ? 4000 : 12000;
      setSalesData([
        { name: 'P1', value: baseValue * 0.8 },
        { name: 'P2', value: baseValue * 1.1 },
        { name: 'P3', value: baseValue * 0.9 },
        { name: 'P4', value: baseValue * 1.2 },
        { name: 'P5', value: baseValue * 1.0 },
        { name: 'P6', value: baseValue * 1.3 },
      ]);

      // Fetch actual stats
      fetch(`/api/inventory/items?companyId=${currentCompany.id}`)
        .then(res => res.json())
        .then(data => setStats(prev => ({ ...prev, totalItems: data.length })))
        .catch(() => {}); // Ignore errors for now
      
      fetch(`/api/purchase-requests?companyId=${currentCompany.id}`)
        .then(res => res.json())
        .then(data => setStats(prev => ({ ...prev, pendingRequests: data.filter((r: any) => r.status === 'pending').length })))
        .catch(() => {});

      fetch(`/api/sales/orders?companyId=${currentCompany.id}`)
        .then(res => res.json())
        .then(data => {
          const total = data.reduce((acc: number, curr: any) => acc + curr.total_amount, 0);
          setStats(prev => ({ ...prev, totalSales: total }));
        })
        .catch(() => {});

      // INTEGRATION: Read from localStorage for simulated Finance data
      const storedReceivables = localStorage.getItem('nexus_new_receivable');
      let localReceivablesTotal = 0;
      if (storedReceivables) {
        try {
          // It might be a single object or array, handle both
          const parsed = JSON.parse(storedReceivables);
          const receivablesArray = Array.isArray(parsed) ? parsed : [parsed];
          localReceivablesTotal = receivablesArray.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
        } catch (e) {
          console.error("Error parsing local receivables", e);
        }
      }

      const storedPayables = localStorage.getItem('nexus_new_payable');
      let localPayablesTotal = 0;
      if (storedPayables) {
        try {
           const parsed = JSON.parse(storedPayables);
           const payablesArray = Array.isArray(parsed) ? parsed : [parsed];
           localPayablesTotal = payablesArray.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
        } catch (e) {
          console.error("Error parsing local payables", e);
        }
      }

      // Update stats with local data (simulating API response merging)
      setStats(prev => ({
        ...prev,
        receivables: prev.receivables + localReceivablesTotal,
        payables: prev.payables + localPayablesTotal
      }));

      fetch(`/api/finance/receivable?companyId=${currentCompany.id}`)
        .then(res => res.json())
        .then(data => {
          const total = data.reduce((acc: number, curr: any) => acc + curr.amount, 0);
          setStats(prev => ({ ...prev, receivables: total + localReceivablesTotal }));
        })
        .catch(() => {
           // If API fails, just keep the local total
           setStats(prev => ({ ...prev, receivables: localReceivablesTotal }));
        });

      fetch(`/api/finance/payable?companyId=${currentCompany.id}`)
        .then(res => res.json())
        .then(data => {
          const total = data.reduce((acc: number, curr: any) => acc + curr.amount, 0);
          setStats(prev => ({ ...prev, payables: total + localPayablesTotal }));
        })
        .catch(() => {
           setStats(prev => ({ ...prev, payables: localPayablesTotal }));
        });

      // Generate AI Insight
      aiService.generateResponse("Gere um insight curto (máximo 2 frases) sobre o status do ERP hoje. Considere que o faturamento está em R$ 158k, existem 12 itens em estoque crítico e 15 OS em aberto.")
        .then(res => setAiInsight(res || ''));
    }
  }, [currentCompany, timeRange, currentBranch]);

  const renderFilters = () => (
    <div className="flex flex-wrap items-center gap-4 mb-6 bg-white p-4 rounded-xl border shadow-sm dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-zinc-500" />
        <span className="text-sm font-medium">Filtros:</span>
      </div>
      
      <Select value={timeRange} onValueChange={setTimeRange}>
        <SelectTrigger className="w-[180px] h-9">
          <Calendar className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Últimos 7 dias</SelectItem>
          <SelectItem value="30d">Últimos 30 dias</SelectItem>
          <SelectItem value="90d">Últimos 90 dias</SelectItem>
          <SelectItem value="year">Este ano</SelectItem>
        </SelectContent>
      </Select>

      <Select value={currentBranch?.id || 'all'}>
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Filial" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as Filiais</SelectItem>
          {branches.map(b => (
            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="ghost" size="sm" className="text-zinc-500">
        Limpar Filtros
      </Button>
    </div>
  );

  const renderAdminDashboard = () => {
    const topWidgets = [
      {
        id: 'faturamento',
        content: (
          <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <PrivacyMask value={stats.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
              </div>
              <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-emerald-500" /> +12.5% <span className="text-[10px] opacity-70">vs mês anterior</span>
              </p>
            </CardContent>
          </Card>
        )
      },
      {
        id: 'receber',
        content: (
          <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas a Receber</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <PrivacyMask value={stats.receivables.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
              </div>
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> 8 faturas vencendo esta semana
              </p>
            </CardContent>
          </Card>
        )
      },
      {
        id: 'estoque',
        content: (
          <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque Crítico</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12 itens</div>
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                <Package className="h-3 w-3" /> Necessita reposição imediata
              </p>
            </CardContent>
          </Card>
        )
      },
      {
        id: 'pagar',
        content: (
          <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-shadow h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle>
              <CreditCard className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <PrivacyMask value={stats.payables.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
              </div>
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-rose-500" /> Próximo vencimento: Amanhã
              </p>
            </CardContent>
          </Card>
        )
      }
    ];

    return (
    <div className="space-y-6">
      <DraggableDashboard widgets={topWidgets} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6 min-w-0">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fluxo de Caixa</CardTitle>
                <CardDescription>Entradas e Saídas consolidadas</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold uppercase text-zinc-500">Entradas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-bold uppercase text-zinc-500">Saídas</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] min-h-[350px] w-full min-w-0 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" strokeOpacity={0.2} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#888' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#888' }}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorIn)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#f43f5e" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorOut)" 
                      data={salesData.map(d => ({ ...d, value: d.value * 0.6 }))}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 dark:text-zinc-100">
                <History className="h-4 w-4 text-zinc-500 dark:text-zinc-400" /> Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="space-y-1">
                {[
                  { user: 'Admin', action: 'confirmou pedido #1204', time: '5 min atrás', icon: ShoppingCart, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 dark:text-emerald-300' },
                  { user: 'Carlos', action: 'abriu O.S. #4592', time: '12 min atrás', icon: Wrench, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/40 dark:text-blue-300' },
                  { user: 'Sistema', action: 'estoque baixo: Cabo HDMI', time: '1h atrás', icon: AlertCircle, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/40 dark:text-amber-300' },
                  { user: 'Admin', action: 'cadastrou novo cliente', time: '2h atrás', icon: UserPlus, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-3 hover:bg-zinc-50 transition-colors dark:hover:bg-zinc-800">
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", item.color)}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        <span className="font-bold">{item.user}</span> {item.action}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 dark:text-zinc-100">
                <TrendingUp className="h-4 w-4 text-zinc-500 dark:text-zinc-400" /> Top Produtos (Mês)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Roteador Wi-Fi 6', sales: 45, growth: '+12%', color: 'bg-emerald-500' },
                  { name: 'Cabo Rede Cat6', sales: 32, growth: '+8%', color: 'bg-blue-500' },
                  { name: 'Switch 24 Portas', sales: 18, growth: '-2%', color: 'bg-amber-500' },
                  { name: 'Antena 5G', sales: 12, growth: '+24%', color: 'bg-rose-500' },
                ].map((prod, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-medium dark:text-zinc-300">
                      <span>{prod.name}</span>
                      <span className="text-zinc-500 dark:text-zinc-400">{prod.sales} un. <span className={cn("ml-1 font-bold", prod.growth.startsWith('+') ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>{prod.growth}</span></span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                      <div className={cn("h-full rounded-full", prod.color)} style={{ width: `${(prod.sales / 45) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          </div>
        </div>

        <div className="lg:col-span-4 space-y-6 min-w-0">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="bg-zinc-900 text-white pb-6">
              <CardTitle className="text-base">Ações Rápidas</CardTitle>
              <CardDescription className="text-zinc-400">Atalhos para as tarefas mais comuns</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 divide-x divide-y border-b dark:divide-zinc-800 dark:border-zinc-800">
                <Button 
                  variant="ghost" 
                  className="h-24 rounded-none flex flex-col gap-2 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/20"
                  onClick={() => navigate('/tecnica/os')}
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-xs font-bold">Nova O.S.</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-24 rounded-none flex flex-col gap-2 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/20"
                  onClick={() => navigate('/comercial/pedidos')}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-xs font-bold">Novo Pedido</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-24 rounded-none flex flex-col gap-2 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/20"
                  onClick={() => navigate('/cadastros/geral')}
                >
                  <UserPlus className="h-5 w-5" />
                  <span className="text-xs font-bold">Novo Cliente</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-24 rounded-none flex flex-col gap-2 hover:bg-zinc-50 hover:text-zinc-900 dark:hover:bg-zinc-800/50"
                  onClick={() => navigate('/relatorios')}
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-xs font-bold">Relatórios</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Distribuição por Setor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] min-h-[250px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Vendas', value: 400 },
                        { name: 'Serviços', value: 300 },
                        { name: 'Peças', value: 300 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { name: 'Vendas', value: '40%', color: 'bg-emerald-500' },
                  { name: 'Serviços', value: '30%', color: 'bg-blue-500' },
                  { name: 'Peças', value: '30%', color: 'bg-amber-500' },
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", item.color)} />
                      <span className="text-zinc-500">{item.name}</span>
                    </div>
                    <span className="font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-gradient-to-br from-emerald-600 to-emerald-800 text-white dark:from-emerald-700 dark:to-emerald-950">
            <CardContent className="p-6 space-y-4">
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-100">Meta de Faturamento</p>
                <h3 className="text-2xl font-bold">
                  <PrivacyMask value="R$ 1.2M / R$ 1.5M" />
                </h3>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white dark:bg-emerald-400 rounded-full" style={{ width: '80%' }} />
                </div>
                <p className="text-[10px] text-emerald-100 dark:text-emerald-300 text-right font-bold">80% da meta atingida</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
  };

  const renderSalesDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Minhas Vendas (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">
              <PrivacyMask value="R$ 45.230,00" />
            </div>
            <div className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> +15% vs meta do mês
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <div className="text-xs text-zinc-500 mt-1">Aguardando confirmação do cliente</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversão de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24%</div>
            <div className="text-xs text-zinc-500 mt-1">Média de fechamento</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Funil de Vendas</CardTitle>
          <CardDescription>Acompanhamento de oportunidades em aberto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: 'Prospecção', value: 45, color: 'bg-zinc-200' },
              { label: 'Qualificação', value: 32, color: 'bg-blue-200' },
              { label: 'Proposta', value: 18, color: 'bg-amber-200' },
              { label: 'Negociação', value: 12, color: 'bg-emerald-200' },
            ].map(stage => (
              <div key={stage.label} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span>{stage.label}</span>
                  <span>{stage.value} leads</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", stage.color)} style={{ width: `${(stage.value / 45) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInventoryDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Itens em Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-zinc-500 mt-1">Total de SKUs ativos</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">Estoque Crítico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">12</div>
            <div className="text-xs text-amber-700 mt-1">Necessita reposição imediata</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Solicitações de Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <div className="text-xs text-zinc-500 mt-1">Pendentes de aprovação</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimentações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: 'entry', item: 'Cabo de Rede Cat6', qty: '+50', time: '10 min atrás' },
              { type: 'exit', item: 'Switch 24 Portas', qty: '-2', time: '1 hora atrás' },
              { type: 'entry', item: 'Roteador Wi-Fi 6', qty: '+10', time: '3 horas atrás' },
            ].map((mov, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-full", mov.type === 'entry' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                    {mov.type === 'entry' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{mov.item}</p>
                    <p className="text-xs text-zinc-500">{mov.time}</p>
                  </div>
                </div>
                <span className={cn("font-bold", mov.type === 'entry' ? "text-emerald-600" : "text-rose-600")}>{mov.qty}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFinanceDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo em Caixa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <PrivacyMask value="R$ 152.430,00" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">A Receber (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              <PrivacyMask value="R$ 12.500,00" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">A Pagar (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              <PrivacyMask value="R$ 8.200,00" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">4.2%</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTechnicalDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">OS em Aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <div className="text-xs text-zinc-500 mt-1">Aguardando atendimento</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">OS em Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">4</div>
            <div className="text-xs text-zinc-500 mt-1">Técnicos em campo</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Concluídas (Hoje)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">6</div>
            <div className="text-xs text-zinc-500 mt-1">Meta diária: 8</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ordens de Serviço Prioritárias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { id: 'OS-1024', client: 'Empresa ABC', issue: 'Internet Lenta', priority: 'high' },
              { id: 'OS-1025', client: 'João Silva', issue: 'Instalação de Roteador', priority: 'medium' },
              { id: 'OS-1026', client: 'Condomínio Solar', issue: 'Manutenção Preventiva', priority: 'low' },
            ].map(os => (
              <div key={os.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    os.priority === 'high' ? "bg-rose-500" : os.priority === 'medium' ? "bg-amber-500" : "bg-emerald-500"
                  )} />
                  <div>
                    <p className="text-sm font-bold">{os.id} - {os.client}</p>
                    <p className="text-xs text-zinc-500">{os.issue}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/tecnica/os')}>Ver Detalhes</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Painel de Controle</h2>
          <p className="text-zinc-500">Olá, {authUser?.name}. Perfil: <span className="font-bold text-primary">{authUser?.role?.toUpperCase()}</span></p>
        </div>
        <div className="flex items-center gap-2">
          {can('view_reports') && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" onClick={() => navigate('/relatorios')}>
                <CheckCircle2 className="h-4 w-4" /> Exportar
              </Button>
              <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => navigate('/relatorios')}>
                <Plus className="h-4 w-4" /> Novo
              </Button>
            </div>
          )}
        </div>
      </div>

      {renderFilters()}

      <div className="min-w-0 w-full overflow-hidden space-y-6">
        {authUser?.role === 'admin' && renderAdminDashboard()}
        {authUser?.role === 'sales' && renderSalesDashboard()}
        {(authUser?.role === 'stock' || authUser?.role === 'inventory') && renderInventoryDashboard()}
        {authUser?.role === 'finance' && renderFinanceDashboard()}
        {(authUser?.role === 'technical' || authUser?.role === 'tech') && renderTechnicalDashboard()}
        
        {/* Default to admin for now if role not handled */}
        {!['sales', 'stock', 'finance', 'tech', 'technical', 'inventory'].includes(authUser?.role?.toLowerCase() || '') && authUser?.role !== 'admin' && renderAdminDashboard()}
      </div>
      
      <NexusWidget />
    </div>
  );
}
