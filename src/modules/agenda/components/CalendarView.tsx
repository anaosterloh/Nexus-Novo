import { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  User, 
  Bell,
  Calendar as CalendarIcon,
  Filter,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Event {
  id: string;
  title: string;
  date: Date;
  type: 'visit' | 'deadline' | 'parts' | 'vacation' | 'meeting' | 'personal' | 'documentation';
  description: string;
  isPublic: boolean;
  user: string;
  sector?: string;
}

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  
  const [events, setEvents] = useState<Event[]>([
    { 
      id: '1', 
      title: 'Visita Técnica - Hospital Central', 
      date: new Date(), 
      type: 'visit', 
      description: 'Manutenção preventiva no Raio-X', 
      isPublic: true, 
      user: 'Carlos Silva',
      sector: 'Técnico'
    },
    { 
      id: '2', 
      title: 'Prazo Entrega - Licitação SP', 
      date: addDays(new Date(), 2), 
      type: 'deadline', 
      description: 'Último dia para envio da documentação', 
      isPublic: true, 
      user: 'Admin',
      sector: 'Fiscal'
    },
    { 
      id: '3', 
      title: 'Recebimento de Peças - Importação #45', 
      date: addDays(new Date(), -1), 
      type: 'parts', 
      description: 'Chegada prevista no porto de Santos', 
      isPublic: true, 
      user: 'Logística',
      sector: 'Logística'
    },
    { 
      id: '4', 
      title: 'Reunião de Alinhamento', 
      date: new Date(), 
      type: 'meeting', 
      description: 'Metas do segundo trimestre', 
      isPublic: true, 
      user: 'Diretoria',
      sector: 'Diretoria'
    },
    { 
      id: '5', 
      title: 'Vencimento Doc: Alvará Sanitário', 
      date: addDays(new Date(), 5), 
      type: 'documentation', 
      description: 'Cliente: Hospital Santa Maria. Documento obrigatório para faturamento.', 
      isPublic: true, 
      user: 'Fiscal',
      sector: 'Fiscal'
    },
  ]);

  const filteredEvents = events.filter(e => 
    selectedSector === 'all' || e.sector === selectedSector
  );

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Agenda & Compromissos</h2>
          <p className="text-zinc-500">Gerencie suas tarefas, visitas e prazos importantes.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-4 font-bold min-w-[140px] text-center capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por Setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Setores</SelectItem>
              <SelectItem value="Comercial">Comercial</SelectItem>
              <SelectItem value="Financeiro">Financeiro</SelectItem>
              <SelectItem value="Técnico">Técnico</SelectItem>
              <SelectItem value="Logística">Logística</SelectItem>
              <SelectItem value="Fiscal">Fiscal</SelectItem>
              <SelectItem value="Diretoria">Diretoria</SelectItem>
            </SelectContent>
          </Select>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setIsEventModalOpen(true)}>
            <Plus className="h-4 w-4" /> Novo Evento
          </Button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, index) => (
          <div key={index} className="text-center text-xs font-bold uppercase text-zinc-400 py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {calendarDays.map((day, index) => {
          const dayEvents = filteredEvents.filter(e => isSameDay(e.date, day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div
              key={index}
              className={cn(
                "min-h-[120px] bg-white dark:bg-zinc-950 p-2 transition-colors cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                !isCurrentMonth && "bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-300",
                isSelected && "ring-2 ring-blue-500 ring-inset z-10"
              )}
              onClick={() => setSelectedDate(day)}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={cn(
                  "text-sm font-bold h-7 w-7 flex items-center justify-center rounded-full",
                  isToday && "bg-blue-600 text-white",
                  !isToday && isCurrentMonth && "text-zinc-900 dark:text-zinc-100",
                  !isCurrentMonth && "text-zinc-300"
                )}>
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-bold text-zinc-400">{dayEvents.length} eventos</span>
                )}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div 
                    key={event.id} 
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded border truncate",
                      event.type === 'visit' && "bg-blue-50 text-blue-700 border-blue-100",
                      event.type === 'deadline' && "bg-rose-50 text-rose-700 border-rose-100",
                      event.type === 'parts' && "bg-amber-50 text-amber-700 border-amber-100",
                      event.type === 'meeting' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                      event.type === 'vacation' && "bg-purple-50 text-purple-700 border-purple-100",
                      event.type === 'personal' && "bg-zinc-100 text-zinc-700 border-zinc-200",
                      event.type === 'documentation' && "bg-amber-50 text-amber-700 border-amber-100"
                    )}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[9px] text-zinc-400 pl-1">+{dayEvents.length - 3} mais...</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSidePanel = () => {
    const selectedDayEvents = filteredEvents.filter(e => isSameDay(e.date, selectedDate));

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" />
              Avisos e Lembretes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Limite de Crédito Excedido</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-500">Cliente "Hospital Santa Maria" atingiu o limite de R$ 50k.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20">
              <Info className="h-5 w-5 text-blue-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-800 dark:text-blue-400">Peças Disponíveis</p>
                <p className="text-[10px] text-blue-700 dark:text-blue-500">As peças para a O.S. #2024-002 chegaram ao estoque.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-zinc-500" />
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {selectedDayEvents.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 italic text-sm">
                  Nenhum compromisso para este dia.
                </div>
              ) : (
                selectedDayEvents.map(event => (
                  <div key={event.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className={cn(
                        "text-[10px] uppercase",
                        event.type === 'visit' && "text-blue-600 border-blue-200",
                        event.type === 'deadline' && "text-rose-600 border-rose-200",
                        event.type === 'meeting' && "text-emerald-600 border-emerald-200"
                      )}>
                        {event.type}
                      </Badge>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <User className="h-3 w-3" /> {event.user}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold mb-1">{event.title}</h4>
                    <p className="text-xs text-zinc-500 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2">Editar</Button>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 text-rose-600">Remover</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderHeader()}

      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {renderDays()}
            {renderCells()}
          </div>
          <div className="lg:col-span-1">
            {renderSidePanel()}
          </div>
        </div>
      </div>

      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Compromisso</DialogTitle>
            <DialogDescription>Adicione um evento à sua agenda ou para toda a equipe.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título do Evento</Label>
              <Input id="title" placeholder="Ex: Reunião com Cliente X" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Data</Label>
                <Input id="date" type="date" defaultValue={format(selectedDate, 'yyyy-MM-dd')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select defaultValue="meeting">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visit">Visita Técnica</SelectItem>
                      <SelectItem value="deadline">Prazo / Deadline</SelectItem>
                      <SelectItem value="parts">Recebimento de Peças</SelectItem>
                      <SelectItem value="documentation">Vencimento de Documento</SelectItem>
                      <SelectItem value="vacation">Férias / Ausência</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="personal">Uso Pessoal</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição / Detalhes</Label>
              <Textarea id="description" placeholder="Informações adicionais sobre o compromisso..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="assignedTo">Atribuir a</Label>
                <Select defaultValue="me">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="me">Para mim</SelectItem>
                    <SelectItem value="all">Para todos</SelectItem>
                    <SelectItem value="sector_finance">Setor: Financeiro</SelectItem>
                    <SelectItem value="sector_tech">Setor: Técnico</SelectItem>
                    <SelectItem value="user_1">Carlos Silva</SelectItem>
                    <SelectItem value="user_2">Maria Oliveira</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select defaultValue="normal">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="isPublic" className="rounded border-zinc-300" defaultChecked />
              <Label htmlFor="isPublic" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Evento visível para toda a equipe
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventModalOpen(false)}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700">Salvar Evento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
