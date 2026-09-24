import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Timer, 
  AlertTriangle, 
  Truck,
  User,
  Filter,
  ChevronDown
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TaskStatus {
  label: string;
  count: number;
  color: string;
  icon: any;
}

interface SectorTasks {
  sector: string;
  statuses: TaskStatus[];
}

export function TaskControlTable() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('status');

  const users = [
    { id: 'all', name: 'Todos os Usuários' },
    { id: '1', name: 'Ana Paula' },
    { id: '2', name: 'Ricardo Oliveira' },
    { id: '3', name: 'Juliana Costa' },
    { id: '4', name: 'Carlos Silva' },
  ];

  const generalTasks = [
    { label: 'Não iniciado', count: 2, color: 'bg-zinc-100 text-zinc-700', icon: Clock },
    { label: 'Em andamento', count: 8, color: 'bg-blue-100 text-blue-700', icon: Timer },
    { label: 'Urgente', count: 0, color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
    { label: 'Prazo hoje', count: 1, color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    { label: 'Prazo vencido', count: 3, color: 'bg-red-100 text-red-700', icon: AlertCircle },
    { label: 'Aguardando coleta', count: 4, color: 'bg-purple-100 text-purple-700', icon: Truck },
    { label: 'Finalizado hoje', count: 2, color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  ];

  const sectorSpecificTasks: SectorTasks[] = [
    {
      sector: 'Financeiro',
      statuses: [
        { label: 'Aguardando cotação', count: 5, color: 'bg-zinc-100 text-zinc-700', icon: Clock },
        { label: 'Aguardando aprovação', count: 3, color: 'bg-blue-100 text-blue-700', icon: Timer },
        { label: 'Aguardando faturar', count: 2, color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
        { label: 'Vence hoje', count: 4, color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
        { label: 'Vencidos', count: 1, color: 'bg-red-100 text-red-700', icon: AlertCircle },
        { label: 'Pagos hoje', count: 8, color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
      ]
    },
    {
      sector: 'Técnica',
      statuses: [
        { label: 'O.S de hoje', count: 6, color: 'bg-blue-100 text-blue-700', icon: Clock },
        { label: 'Aguardando início', count: 2, color: 'bg-zinc-100 text-zinc-700', icon: Timer },
        { label: 'Aguardando peça', count: 4, color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
        { label: 'Peça recebida', count: 3, color: 'bg-emerald-100 text-emerald-700', icon: Truck },
        { label: 'Aguardando aprovação', count: 5, color: 'bg-purple-100 text-purple-700', icon: AlertCircle },
        { label: 'Aprovado', count: 7, color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
        { label: 'Encerrado', count: 12, color: 'bg-zinc-100 text-zinc-700', icon: CheckCircle2 },
      ]
    }
  ];

  const handleDetailClick = (sector: string, status: string) => {
    setSelectedSector(sector);
    setSelectedStatus(status);
  };

  const summaryData = [
    { label: 'Sem prazo definido', count: 14, steps: 1327, color: 'bg-orange-100 dark:bg-orange-900/20', textColor: 'text-orange-700 dark:text-orange-400' },
    { label: 'Itens vencidos', count: 192, steps: 493, color: 'bg-rose-100 dark:bg-rose-900/20', textColor: 'text-rose-700 dark:text-rose-400' },
    { label: 'Vence hoje', count: 2, steps: 1, color: 'bg-teal-100 dark:bg-teal-900/20', textColor: 'text-teal-700 dark:text-teal-400' },
    { label: 'Vence amanhã', count: 1, steps: 3, color: 'bg-cyan-100 dark:bg-cyan-900/20', textColor: 'text-cyan-700 dark:text-cyan-400' },
    { label: 'Vence esta semana', count: 6, steps: 14, color: 'bg-teal-200 dark:bg-teal-900/40', textColor: 'text-teal-800 dark:text-teal-300' },
    { label: 'Vence próxima semana', count: 2, steps: 1, color: 'bg-cyan-200 dark:bg-cyan-900/40', textColor: 'text-cyan-800 dark:text-cyan-300' },
    { label: 'Concluído esta semana', count: 2, steps: 27, color: 'bg-emerald-100 dark:bg-emerald-900/20', textColor: 'text-emerald-700 dark:text-emerald-400' },
    { label: 'Concluído semana passada', count: 1, steps: 12, color: 'bg-emerald-200 dark:bg-emerald-900/40', textColor: 'text-emerald-800 dark:text-emerald-300' },
  ];

  const tableData = [
    { name: 'Carlos Silva', noDue: 13, overdue: 14, today: 0, tomorrow: 0, thisWeek: 0, nextWeek: 0, compThis: 0, compLast: 0 },
    { name: 'Ricardo Oliveira', noDue: 65, overdue: 23, today: 0, tomorrow: 1, thisWeek: 1, nextWeek: 0, compThis: 0, compLast: 0 },
    { name: 'Juliana Costa', noDue: 519, overdue: 174, today: 0, tomorrow: 1, thisWeek: 2, nextWeek: 2, compThis: 0, compLast: 3 },
    { name: 'Marcos Santos', noDue: 204, overdue: 360, today: 0, tomorrow: 2, thisWeek: 4, nextWeek: 0, compThis: 0, compLast: 1 },
    { name: 'Ana Paula', noDue: 48, overdue: 0, today: 0, tomorrow: 0, thisWeek: 0, nextWeek: 0, compThis: 0, compLast: 0 },
    { name: 'Roberto Almeida', noDue: 24, overdue: 16, today: 3, tomorrow: 0, thisWeek: 13, nextWeek: 0, compThis: 39, compLast: 10 },
    { name: 'Fernanda Lima', noDue: 433, overdue: 96, today: 0, tomorrow: 0, thisWeek: 0, nextWeek: 1, compThis: 0, compLast: 0 },
    { name: 'Não Atribuído', noDue: 433, overdue: 61, today: 0, tomorrow: 0, thisWeek: 0, nextWeek: 0, compThis: 0, compLast: 0 },
  ];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="status">Controle por Status</TabsTrigger>
          <TabsTrigger value="assigned">Visualização por Atribuição</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          <Card className="border-none shadow-sm bg-zinc-50/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Controle de Tarefas por Status</CardTitle>
                  <p className="text-xs text-zinc-500">Visão geral de produtividade e gargalos por setor.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="w-[200px] h-9">
                      <User className="h-4 w-4 mr-2 text-zinc-400" />
                      <SelectValue placeholder="Filtrar por Usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="gap-2 h-9">
                    <Filter className="h-4 w-4" /> Filtros
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {generalTasks.map((task) => (
                  <div 
                    key={task.label} 
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl border bg-white dark:bg-zinc-900 shadow-sm cursor-pointer hover:scale-105 transition-transform",
                      task.count > 0 ? "border-zinc-200 dark:border-zinc-800" : "opacity-50 grayscale"
                    )}
                    onClick={() => handleDetailClick('Geral', task.label)}
                  >
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center mb-2", task.color)}>
                      <task.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 text-center">{task.label}</span>
                    <span className="text-2xl font-black mt-1">{task.count.toString().padStart(2, '0')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sectorSpecificTasks.map((sector) => (
              <Card key={sector.sector} className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">{sector.sector}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">Setor Ativo</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-zinc-50/50">
                        <TableHead className="text-[10px] uppercase font-bold">Status do Processo</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-center">Quantidade</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sector.statuses.map((status) => (
                        <TableRow key={status.label} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", status.color)}>
                                <status.icon className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-medium">{status.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("font-bold text-sm px-3", status.color)}>
                              {status.count}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs font-bold text-blue-600 hover:text-blue-700"
                              onClick={() => handleDetailClick(sector.sector, status.label)}
                            >
                              Ver Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assigned" className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {summaryData.map((item, i) => (
              <div key={i} className={cn("p-3 rounded-lg shadow-sm flex flex-col items-center text-center border border-transparent dark:border-zinc-800", item.color, item.textColor)}>
                <div className="text-lg font-bold leading-tight">{item.count} Tarefas</div>
                <div className="text-xs font-bold leading-tight">{item.steps} Etapas</div>
                <div className="text-[10px] uppercase mt-2 font-medium opacity-90">{item.label}</div>
              </div>
            ))}
          </div>

          <Card className="overflow-hidden border-none shadow-lg">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900 border-b">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500 text-center">Atribuído a</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <TableHead className="font-bold text-zinc-600">Atribuído a</TableHead>
                    <TableHead className="text-center font-bold text-zinc-600 bg-orange-50 dark:bg-orange-900/20">Sem prazo</TableHead>
                    <TableHead className="text-center font-bold text-zinc-600 bg-rose-50 dark:bg-rose-900/20">Vencidos</TableHead>
                    <TableHead className="text-center font-bold text-zinc-600 bg-teal-50 dark:bg-teal-900/20">Vence hoje</TableHead>
                    <TableHead className="text-center font-bold text-zinc-600 bg-cyan-50 dark:bg-cyan-900/20">Vence amanhã</TableHead>
                    <TableHead className="text-center font-bold text-zinc-600 bg-teal-50 dark:bg-teal-900/20">Vence esta sem.</TableHead>
                    <TableHead className="text-center font-bold text-zinc-600 bg-cyan-50 dark:bg-cyan-900/20">Vence próx. sem.</TableHead>
                    <TableHead className="text-center font-bold text-zinc-600 bg-emerald-50 dark:bg-emerald-900/20">Conc. esta sem.</TableHead>
                    <TableHead className="text-center font-bold text-zinc-600 bg-emerald-50 dark:bg-emerald-900/20">Conc. sem. passada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row, i) => (
                    <TableRow key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <TableCell className="font-bold text-zinc-700 dark:text-zinc-300">{row.name}</TableCell>
                      <TableCell className="text-center font-medium">{row.noDue}</TableCell>
                      <TableCell className="text-center font-medium">{row.overdue}</TableCell>
                      <TableCell className="text-center font-medium">{row.today}</TableCell>
                      <TableCell className="text-center font-medium">{row.tomorrow}</TableCell>
                      <TableCell className="text-center font-medium">{row.thisWeek}</TableCell>
                      <TableCell className="text-center font-medium">{row.nextWeek}</TableCell>
                      <TableCell className="text-center font-medium">{row.compThis}</TableCell>
                      <TableCell className="text-center font-medium">{row.compLast}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-zinc-50 dark:bg-zinc-900 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-center">1720</TableCell>
                    <TableCell className="text-center">744</TableCell>
                    <TableCell className="text-center">3</TableCell>
                    <TableCell className="text-center">4</TableCell>
                    <TableCell className="text-center">20</TableCell>
                    <TableCell className="text-center">3</TableCell>
                    <TableCell className="text-center">39</TableCell>
                    <TableCell className="text-center">13</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedStatus} onOpenChange={(open) => !open && setSelectedStatus(null)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Detalhes: {selectedStatus} ({selectedSector})
            </DialogTitle>
            <DialogDescription>
              Lista de tarefas e processos aguardando ação neste status.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {selectedSector === 'Técnica' ? `OS-2024-00${i}` : `FIN-2024-00${i}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold">
                          US
                        </div>
                        <span className="text-xs">Usuário Exemplo</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        i === 1 ? "text-rose-600 border-rose-200 bg-rose-50" : "text-zinc-500"
                      )}>
                        {i === 1 ? 'URGENTE' : 'NORMAL'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="h-7 text-[10px]">Abrir Registro</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
