import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Package, 
  Search, 
  Filter, 
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Calculator,
  Settings,
  ShieldCheck,
  Plus,
  AlertCircle,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

export function CommissionDashboard() {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!can('view_financials')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar o painel de comissões.</p>
        </div>
      </div>
    );
  }

  const handleProcess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsProcessModalOpen(false);
      toast.success('Comissões processadas com sucesso para o período selecionado!');
    }, 2000);
  };

  const commissions = [
    { id: 1, vendedor: 'Ricardo Oliveira', vendas: 'R$ 125.400,00', comissao: 'R$ 3.762,00', percentual: '3%', status: 'Pendente' },
    { id: 2, vendedor: 'Ana Paula Santos', vendas: 'R$ 98.200,00', comissao: 'R$ 4.910,00', percentual: '5%', status: 'Pago' },
    { id: 3, vendedor: 'Marcos Vinícius', vendas: 'R$ 45.000,00', comissao: 'R$ 900,00', percentual: '2%', status: 'Pendente' },
    { id: 4, vendedor: 'Juliana Costa', vendas: 'R$ 210.000,00', comissao: 'R$ 8.400,00', percentual: '4%', status: 'Processando' },
  ];

  const rules = [
    { id: 1, categoria: 'Equipamentos Novos', comissao: '5%', base: 'Faturamento' },
    { id: 2, categoria: 'Peças e Acessórios', comissao: '8%', base: 'Liquidez (Recebido)' },
    { id: 3, categoria: 'Serviços de Manutenção', comissao: '10%', base: 'Faturamento' },
    { id: 4, categoria: 'Contratos Mensais', comissao: '15%', base: 'Primeira Parcela' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Comissões</h2>
          <p className="text-zinc-500">Cálculo automático baseado em regras por vendedor e categoria.</p>
        </div>
        {can('edit_financials') && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsRulesModalOpen(true)}><Settings className="h-4 w-4 mr-2" /> Regras de Cálculo</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsProcessModalOpen(true)}>
              <Calculator className="h-4 w-4 mr-2" /> Processar Período
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Total Comissões (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 17.972,00</div>
            <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3" /> +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Aguardando Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">R$ 4.662,00</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Vendedores Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Ticket Médio Comiss.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">R$ 1.497,66</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vendedores" className="w-full">
        <TabsList>
          <TabsTrigger value="vendedores" className="gap-2"><Users className="h-4 w-4" /> Por Vendedor</TabsTrigger>
          {can('edit_financials') && (
            <>
              <TabsTrigger value="regras" className="gap-2"><Percent className="h-4 w-4" /> Regras por Categoria</TabsTrigger>
              <TabsTrigger value="vendedor_regras" className="gap-2"><Settings className="h-4 w-4" /> Regras por Vendedor</TabsTrigger>
              <TabsTrigger value="margem" className="gap-2"><TrendingUp className="h-4 w-4" /> Comissões por Margem</TabsTrigger>
            </>
          )}
          <TabsTrigger value="historico" className="gap-2"><Calendar className="h-4 w-4" /> Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="margem" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tabela de Comissões por Margem de Lucro</CardTitle>
              <CardDescription>Incentive a lucratividade premiando vendas com maiores margens.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                  <div className="p-4 bg-zinc-50 rounded-xl border space-y-4">
                    <h4 className="text-sm font-bold">Nova Faixa de Margem</h4>
                    <div className="space-y-2">
                      <Label className="text-xs">Margem Mínima (%)</Label>
                      <Input type="number" placeholder="Ex: 20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Comissão (%)</Label>
                      <Input type="number" placeholder="Ex: 2.5" />
                    </div>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Adicionar Faixa</Button>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-700">Quando ativa, esta regra substitui a comissão fixa da categoria.</p>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Faixa de Margem</TableHead>
                        <TableHead>Comissão Aplicada</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { min: '0% a 15%', comm: '0.5%', status: 'Ativo' },
                        { min: '15.1% a 25%', comm: '2.0%', status: 'Ativo' },
                        { min: '25.1% a 35%', comm: '4.0%', status: 'Ativo' },
                        { min: 'Acima de 35%', comm: '6.5%', status: 'Ativo' },
                      ].map((range, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{range.min}</TableCell>
                          <TableCell className="font-bold text-emerald-600">{range.comm}</TableCell>
                          <TableCell><Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{range.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendedores" className="mt-6 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input placeholder="Buscar por vendedor..." className="pl-10" />
            </div>
            <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filtros</Button>
            <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Exportar</Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Volume de Vendas</TableHead>
                    <TableHead className="text-right">Comissão Devida</TableHead>
                    <TableHead className="text-center">Média %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.vendedor}</TableCell>
                      <TableCell className="text-right font-mono">{item.vendas}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">{item.comissao}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{item.percentual}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          item.status === 'Pago' ? 'bg-emerald-500' : 
                          item.status === 'Pendente' ? 'bg-amber-500' : 'bg-blue-500'
                        )}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Extrato</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendedor_regras" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Comissões por Vendedor</CardTitle>
              <CardDescription>Defina percentuais específicos para cada colaborador, sobrepondo as regras gerais.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Equipamentos</TableHead>
                    <TableHead>Peças</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Ricardo Oliveira</TableCell>
                    <TableCell><Input className="w-20 h-8" defaultValue="3%" /></TableCell>
                    <TableCell><Input className="w-20 h-8" defaultValue="5%" /></TableCell>
                    <TableCell><Input className="w-20 h-8" defaultValue="10%" /></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm">Salvar</Button></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Ana Paula Santos</TableCell>
                    <TableCell><Input className="w-20 h-8" defaultValue="5%" /></TableCell>
                    <TableCell><Input className="w-20 h-8" defaultValue="8%" /></TableCell>
                    <TableCell><Input className="w-20 h-8" defaultValue="12%" /></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm">Salvar</Button></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regras" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {rules.map((rule) => (
              <Card key={rule.id} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">{rule.categoria}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{rule.comissao}</span>
                    <span className="text-xs text-zinc-500">de comissão</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Base de Cálculo</p>
                    <p className="text-xs font-medium">{rule.base}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-[10px] h-7">Editar Regra</Button>
                </CardContent>
              </Card>
            ))}
            <Card className="border-dashed flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-zinc-50 transition-colors">
              <Plus className="h-8 w-8 text-zinc-300 mb-2" />
              <p className="text-xs font-bold text-zinc-400">Nova Regra</p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Regras de Cálculo */}
      <Dialog open={isRulesModalOpen} onOpenChange={setIsRulesModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Regras Gerais de Cálculo
            </DialogTitle>
            <DialogDescription>
              Configure como o sistema deve calcular as comissões por padrão.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base de Cálculo Padrão</Label>
                <Select defaultValue="faturamento">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faturamento">Faturamento (Emissão)</SelectItem>
                    <SelectItem value="liquidez">Liquidez (Recebimento)</SelectItem>
                    <SelectItem value="margem">Margem de Contribuição</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Momento da Geração</Label>
                <Select defaultValue="pagamento">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emissao">Na Emissão da NF-e</SelectItem>
                    <SelectItem value="pagamento">No Pagamento do Título</SelectItem>
                    <SelectItem value="entrega">Na Entrega do Pedido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Descontar Impostos da Base?</Label>
              <div className="flex items-center gap-4 p-3 border rounded-lg bg-zinc-50">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="tax-pis" className="rounded" />
                  <label htmlFor="tax-pis" className="text-xs">PIS/COFINS</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="tax-icms" className="rounded" />
                  <label htmlFor="tax-icms" className="text-xs">ICMS</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="tax-ipi" className="rounded" />
                  <label htmlFor="tax-ipi" className="text-xs">IPI</label>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <p className="text-[10px] text-blue-700">As regras definidas aqui serão aplicadas a todas as novas vendas, a menos que o vendedor possua uma regra específica configurada em seu cadastro.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRulesModalOpen(false)}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700">Salvar Configurações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Processamento */}
      <Dialog open={isProcessModalOpen} onOpenChange={setIsProcessModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              Processar Comissões
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mês de Referência</Label>
              <Select defaultValue="02-2024">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="02-2024">Fevereiro / 2024</SelectItem>
                  <SelectItem value="01-2024">Janeiro / 2024</SelectItem>
                  <SelectItem value="12-2023">Dezembro / 2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Vendedores</Label>
              <Select defaultValue="todos">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Vendedores</SelectItem>
                  <SelectItem value="internos">Apenas Internos</SelectItem>
                  <SelectItem value="externos">Apenas Representantes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isProcessing && (
              <div className="space-y-2 animate-in fade-in">
                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 animate-progress origin-left"></div>
                </div>
                <p className="text-[10px] text-center text-zinc-500">Calculando comissões e gerando extratos...</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsProcessModalOpen(false)} disabled={isProcessing}>Cancelar</Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={handleProcess}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processando...' : 'Iniciar Processamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
