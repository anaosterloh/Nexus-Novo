import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrivacyMask } from '@/context/PrivacyContext';
import { ModuleStatusBadge } from '@/components/common/ModuleStatusBadge';
import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Download, 
  Search, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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
  Pie
} from 'recharts';

export function FiscalDashboard({ defaultTab = 'notas' }: { defaultTab?: string }) {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  // Map the URL tab names to internal ones
  const mapTab = (tab: string) => {
    if (tab === 'notas') return 'overview';
    if (tab === 'impostos' || tab === 'configuracoes') return 'taxes';
    return 'overview';
  };

  const stats = [
    { title: 'NF-e Emitidas (Mês)', value: '158', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Total Impostos', value: 'R$ 12.672,00', icon: Calculator, color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: 'NF-e de Entrada', value: '42', icon: ArrowDownRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Pendências Sefaz', value: '0', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const recentNotes = [
    { id: 'NF-4590', type: 'Saída', customer: 'Hospital Santa Maria', value: 15200.00, status: 'Autorizada', date: '27/02/2026' },
    { id: 'NF-4589', type: 'Saída', customer: 'Clínica Sorriso', value: 2450.00, status: 'Autorizada', date: '26/02/2026' },
    { id: 'NF-1024', type: 'Entrada', customer: 'Distribuidora Global', value: 8900.00, status: 'Processada', date: '25/02/2026' },
    { id: 'NF-4588', type: 'Saída', customer: 'Indústria Metalúrgica', value: 45000.00, status: 'Autorizada', date: '24/02/2026' },
  ];

  const taxData = [
    { name: 'ICMS', value: 8500 },
    { name: 'IPI', value: 2100 },
    { name: 'PIS/COFINS', value: 1500 },
    { name: 'ISS', value: 572 },
  ];

  const COLORS = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b'];

  if (!can('view_fiscal')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar o painel fiscal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Gestão Fiscal</h2>
            <ModuleStatusBadge status="Visual" />
          </div>
          <p className="text-zinc-500">Monitoramento de notas fiscais, impostos e obrigações acessórias.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Exportar XMLs
          </Button>
          {can('edit_fiscal') && (
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <FileText className="h-4 w-4" /> Emitir NF-e
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
              <div className="text-2xl font-bold">
                {stat.title.includes('Valor') || stat.title.includes('Impostos') ? (
                  <PrivacyMask value={stat.value} />
                ) : (
                  stat.value
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue={mapTab(defaultTab)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="taxes">Tributos e Regras</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Faturamento vs Impostos</CardTitle>
                <CardDescription>Evolução mensal da carga tributária sobre as vendas.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] min-h-[300px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { month: 'Set', fat: 120000, tax: 9600 },
                      { month: 'Out', fat: 145000, tax: 11600 },
                      { month: 'Nov', fat: 138000, tax: 11040 },
                      { month: 'Dez', fat: 185000, tax: 14800 },
                      { month: 'Jan', fat: 152000, tax: 12160 },
                      { month: 'Fev', fat: 158400, tax: 12672 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" strokeOpacity={0.2} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="fat" fill="#3b82f6" name="Faturamento" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="tax" fill="#f43f5e" name="Impostos" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Impostos</CardTitle>
                <CardDescription>Composição da carga tributária atual.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] min-h-[300px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taxData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {taxData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {taxData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                          <span className="text-zinc-500">{item.name}</span>
                        </div>
                        <span className="font-bold">
                          <PrivacyMask value={`R$ ${item.value.toLocaleString('pt-BR')}`} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Últimas Notas Fiscais</CardTitle>
                <CardDescription>Acompanhamento em tempo real das emissões e recepções.</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input placeholder="Buscar nota..." className="pl-10 h-9 w-[200px]" />
                </div>
                <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" /> Filtros</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Destinatário / Emitente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentNotes.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell className="font-bold">{note.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          note.type === 'Saída' ? "text-blue-600 border-blue-200 bg-blue-50" : "text-emerald-600 border-emerald-200 bg-emerald-50"
                        )}>
                          {note.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{note.customer}</TableCell>
                      <TableCell className="text-xs text-zinc-500">{note.date}</TableCell>
                      <TableCell className="text-right font-bold">
                        <PrivacyMask value={note.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-xs font-medium">{note.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">DANFE</Button>
                        <Button variant="ghost" size="sm">XML</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Tributação</CardTitle>
              <CardDescription>Configurações de alíquotas e regimes tributários.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Regime Tributário</label>
                    <Input value="Simples Nacional" readOnly className="bg-zinc-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Alíquota Padrão ICMS</label>
                    <Input value="18%" readOnly className="bg-zinc-50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Observações Fiscais</label>
                  <textarea 
                    className="w-full min-h-[100px] p-3 rounded-md border text-sm bg-zinc-50"
                    placeholder="Insira observações gerais sobre a tributação da empresa..."
                    readOnly
                  >
                    Empresa optante pelo Simples Nacional.
                    Não gera crédito de IPI.
                    Permite aproveitamento de crédito de ICMS no valor do imposto cobrado na operação anterior.
                  </textarea>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
