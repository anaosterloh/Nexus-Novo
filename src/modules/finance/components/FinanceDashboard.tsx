import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Filter, 
  TrendingUp, 
  PieChart as PieChartIcon,
  Download,
  Plus,
  Building2,
  Wallet,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { FinanceEntryForm } from './FinanceEntryForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrivacyMask } from '@/context/PrivacyContext';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line
} from 'recharts';

interface FinanceItem {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  customer_name?: string;
  category?: string;
  department?: string;
}

export function FinanceDashboard() {
  const { currentCompany } = useApp();
  const { can } = usePermissions();
  const [receivables, setReceivables] = useState<FinanceItem[]>([]);
  const [payables, setPayables] = useState<FinanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);

  const fetchFinance = () => {
    if (currentCompany) {
      setLoading(true);
      Promise.all([
        fetch(`/api/finance/receivable?companyId=${currentCompany.id}`).then(res => res.json()),
        fetch(`/api/finance/payable?companyId=${currentCompany.id}`).then(res => res.json())
      ]).then(([recData, payData]) => {
        setReceivables(recData);
        setPayables(payData);
        setLoading(false);
      });
    }
  };

  useEffect(() => {
    if (can('view_financials')) {
      fetchFinance();
    } else {
      setLoading(false);
    }
  }, [currentCompany, can]);

  const handlePay = async (type: 'receivable' | 'payable', id: string) => {
    if (!can('edit_financials')) {
      toast.error('Você não tem permissão para realizar esta ação.');
      return;
    }
    
    try {
      const response = await fetch(`/api/finance/${type}/${id}/pay`, { method: 'PUT' });
      if (response.ok) {
        toast.success(type === 'receivable' ? 'Recebimento registrado!' : 'Pagamento registrado!');
        fetchFinance();
      }
    } catch (error) {
      toast.error('Erro ao processar baixa');
    }
  };

  if (!can('view_financials')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar o painel financeiro.</p>
        </div>
      </div>
    );
  }

  const totalReceivable = receivables.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPayable = payables.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalReceivable - totalPayable;
  const profitMargin = totalReceivable > 0 ? (netProfit / totalReceivable) * 100 : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case 'paid': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Pago</Badge>;
      case 'overdue': return <Badge variant="destructive">Atrasado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Entradas (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              <PrivacyMask value={totalReceivable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">+8.2% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Saídas (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              <PrivacyMask value={totalPayable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">-2.4% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Lucro Real</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              <PrivacyMask value={netProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Saldo líquido operacional</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Margem Líquida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              <PrivacyMask value={`${profitMargin.toFixed(1)}%`} />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Eficiência financeira</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Projeção de Fluxo de Caixa (30 dias)</CardTitle>
              <CardDescription>Saldo acumulado projetado com base em contas a pagar e receber.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Saldo Atual: <PrivacyMask value="R$ 152.430,00" className="ml-1" />
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] min-h-[350px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { day: '27/02', balance: 152430 },
                  { day: '01/03', balance: 148200 },
                  { day: '05/03', balance: 162500 },
                  { day: '10/03', balance: 158000 },
                  { day: '15/03', balance: 175000 },
                  { day: '20/03', balance: 168000 },
                  { day: '25/03', balance: 192000 },
                  { day: '30/03', balance: 215000 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" strokeOpacity={0.2} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(val) => `R$ ${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Saldo Projetado']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Caixa Mensal</CardTitle>
            <CardDescription>Comparativo de entradas e saídas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] min-h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Jan', in: 45000, out: 32000 },
                  { name: 'Fev', in: 52000, out: 38000 },
                  { name: 'Mar', in: 48000, out: 41000 },
                  { name: 'Abr', in: 61000, out: 45000 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="in" fill="#10b981" name="Entradas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="out" fill="#f43f5e" name="Saídas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas por Departamento</CardTitle>
            <CardDescription>Distribuição de custos fixos e variáveis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] min-h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Comercial', value: 12000 },
                      { name: 'Técnico', value: 15000 },
                      { name: 'Adm', value: 8000 },
                      { name: 'Logística', value: 6000 },
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
                    <Cell fill="#8b5cf6" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão Financeira</h2>
          <p className="text-zinc-500">Controle total de entradas, saídas e lucratividade.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Relatório PDF
          </Button>
          {can('edit_financials') && (
            <Button 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setIsEntryFormOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Lançamento
            </Button>
          )}
        </div>
      </div>

      <FinanceEntryForm 
        open={isEntryFormOpen} 
        onOpenChange={setIsEntryFormOpen} 
        onSuccess={fetchFinance} 
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="receivables">A Receber</TabsTrigger>
          <TabsTrigger value="payables">A Pagar</TabsTrigger>
          <TabsTrigger value="profit">Lucro Real</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="receivables" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contas a Receber</CardTitle>
                <CardDescription>Lista de faturas e pagamentos pendentes de clientes.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.info('Filtros avançados em breve.')}><Filter className="h-4 w-4 mr-2" /> Filtros</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivables.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs font-mono">{format(new Date(item.due_date), 'dd/MM/yy')}</TableCell>
                      <TableCell className="font-medium">{item.customer_name || 'Manual'}</TableCell>
                      <TableCell className="text-xs text-zinc-500">{item.description}</TableCell>
                      <TableCell><Badge variant="outline">{item.department || 'Geral'}</Badge></TableCell>
                      <TableCell className="text-right font-bold">
                        <PrivacyMask value={item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} />
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handlePay('receivable', item.id)}
                          disabled={!can('edit_financials')}
                        >
                          Baixar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payables" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>Compromissos financeiros com fornecedores e despesas fixas.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Fornecedor / Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payables.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs font-mono">{format(new Date(item.due_date), 'dd/MM/yy')}</TableCell>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-zinc-50">{item.category || 'Despesa'}</Badge></TableCell>
                      <TableCell className="text-right font-bold text-rose-600">
                        <PrivacyMask value={item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} />
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handlePay('payable', item.id)}
                          disabled={!can('edit_financials')}
                        >
                          Pagar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Demonstrativo de Resultados (DRE)</CardTitle>
                  <CardDescription>Análise detalhada de lucro e prejuízo por período.</CardDescription>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Setor / Departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Setores</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="logistica">Logística</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Receita Bruta Operacional</span>
                    <span className="font-bold text-emerald-600"><PrivacyMask value="R$ 158.400,00" /></span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">(-) Impostos sobre Vendas</span>
                    <span className="font-bold text-rose-600"><PrivacyMask value="R$ 12.672,00" /></span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b bg-zinc-50 dark:bg-zinc-900/50 px-2 rounded">
                    <span className="font-bold">Receita Líquida</span>
                    <span className="font-bold"><PrivacyMask value="R$ 145.728,00" /></span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">(-) Custos de Mercadorias/Serviços (CMV)</span>
                    <span className="font-bold text-rose-600"><PrivacyMask value="R$ 68.200,00" /></span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b bg-zinc-50 dark:bg-zinc-900/50 px-2 rounded">
                    <span className="font-bold">Lucro Bruto</span>
                    <span className="font-bold text-emerald-600"><PrivacyMask value="R$ 77.528,00" /></span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">(-) Despesas Operacionais (Fixas + Variáveis)</span>
                    <span className="font-bold text-rose-600"><PrivacyMask value="R$ 32.400,00" /></span>
                  </div>
                  <div className="flex justify-between items-center py-4 bg-blue-50 dark:bg-blue-900/20 px-4 rounded-lg">
                    <div className="flex flex-col">
                      <span className="font-bold text-lg text-blue-700 dark:text-blue-400">LUCRO LÍQUIDO REAL</span>
                      <span className="text-xs text-blue-600 dark:text-blue-500">EBITDA Ajustado</span>
                    </div>
                    <span className="font-black text-2xl text-blue-700 dark:text-blue-400"><PrivacyMask value="R$ 45.128,00" /></span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Ponto de Equilíbrio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold"><PrivacyMask value="R$ 82.450,00" /></div>
                  <p className="text-xs text-zinc-500 mt-1">Faturamento necessário para cobrir custos.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">ROI Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600"><PrivacyMask value="24.5%" /></div>
                  <p className="text-xs text-zinc-500 mt-1">Retorno sobre investimento operacional.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
