import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Package, 
  Globe, 
  Calendar, 
  Phone, 
  Mail, 
  ShieldCheck, 
  ShieldAlert,
  History,
  Beaker,
  Info,
  ExternalLink,
  MapPin,
  Users,
  MessageSquare,
  Edit,
  Plus
} from 'lucide-react';
import { ProductStudy } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface StudyDetailsProps {
  study: ProductStudy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (study: ProductStudy) => void;
}

export function StudyDetails({ study, open, onOpenChange, onEdit }: StudyDetailsProps) {
  const getReliabilityBadge = (reliability: ProductStudy['reliability']) => {
    switch (reliability) {
      case 'high': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><ShieldCheck className="h-3 w-3 mr-1" /> Alta Confiabilidade</Badge>;
      case 'medium': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Média Confiabilidade</Badge>;
      case 'low': return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><ShieldAlert className="h-3 w-3 mr-1" /> Baixa Confiabilidade</Badge>;
      case 'unreliable': return <Badge variant="destructive">Não Confiável</Badge>;
      default: return <Badge variant="secondary">{reliability}</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <Beaker className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Estudo de Produto</span>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => onEdit(study)}>
              <Edit className="h-4 w-4" /> Editar
            </Button>
          </div>
          <SheetTitle className="text-2xl font-bold tracking-tight">{study.productName}</SheetTitle>
          <SheetDescription className="flex items-center gap-2 mt-1">
            <Building2 className="h-4 w-4" /> {study.companyName} • 
            <span className="flex items-center gap-1">
              {study.origin === 'international' ? <Globe className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
              {study.origin === 'international' ? 'Internacional' : 'Nacional'}
            </span>
          </SheetDescription>
          <div className="mt-4">
            {getReliabilityBadge(study.reliability)}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            {/* Definições e Composição */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
                <Info className="h-4 w-4 text-emerald-600" />
                <h3>Definições e Composição</h3>
              </div>
              <div className="grid gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-2">O que é / Definição</p>
                  <p className="text-sm leading-relaxed">{study.definitions || 'Nenhuma definição registrada.'}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Composição / Materiais</p>
                  <p className="text-sm leading-relaxed">{study.composition || 'Nenhuma informação de composição.'}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Uso / Aplicações</p>
                  <p className="text-sm leading-relaxed">{study.usage || 'Nenhuma informação de uso.'}</p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Contato e Negócios */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
                <Users className="h-4 w-4 text-emerald-600" />
                <h3>Contato e Negócios</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-zinc-500">Pessoa de Contato</p>
                    <p className="text-sm font-medium">{study.internalContact?.name || 'Não informado'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-zinc-500">E-mail</p>
                    <p className="text-sm flex items-center gap-2">
                      <Mail className="h-3 w-3 text-zinc-400" />
                      {study.internalContact?.email || 'Não informado'}
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-[10px] uppercase font-bold text-zinc-500">Telefones</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {study.internalContact?.phones?.map((phone, i) => (
                        <Badge key={i} variant="secondary" className="gap-1.5">
                          <Phone className="h-3 w-3" /> {phone}
                        </Badge>
                      )) || 'Nenhum telefone'}
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" /> Observações de Confiabilidade
                  </p>
                  <p className="text-sm italic text-emerald-900 dark:text-emerald-100">
                    "{study.businessObservations || 'Sem observações registradas.'}"
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Calendário e Eventos */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <h3>Agenda e Eventos</h3>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  <Plus className="h-3 w-3" /> Agendar
                </Button>
              </div>
              <div className="space-y-3">
                {study.events && study.events.length > 0 ? (
                  study.events.map((event) => (
                    <div key={event.id} className="flex gap-4 p-3 rounded-lg border bg-white dark:bg-zinc-950 shadow-sm">
                      <div className="flex flex-col items-center justify-center min-w-[50px] border-r pr-3">
                        <span className="text-[10px] uppercase font-bold text-zinc-500">
                          {format(new Date(event.date), 'MMM', { locale: ptBR })}
                        </span>
                        <span className="text-lg font-black">
                          {format(new Date(event.date), 'dd')}
                        </span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold">{event.title}</p>
                          <Badge variant="outline" className="text-[10px] h-5">
                            {event.type === 'fair' ? 'Feira' : event.type === 'meeting' ? 'Reunião' : 'Visita'}
                          </Badge>
                        </div>
                        {event.location && (
                          <p className="text-xs text-zinc-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {event.location}
                          </p>
                        )}
                        {event.notes && <p className="text-xs italic text-zinc-400 mt-1">"{event.notes}"</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500 text-center py-4 italic">Nenhum evento agendado.</p>
                )}
              </div>
            </section>

            <Separator />

            {/* Histórico de Avaliações / Logs */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
                <History className="h-4 w-4 text-emerald-600" />
                <h3>Histórico de Avaliações / Logs</h3>
              </div>
              <div className="space-y-3">
                {study.evaluationLogs && study.evaluationLogs.length > 0 ? (
                  study.evaluationLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-zinc-400" />
                          <span className="text-[10px] font-bold uppercase text-zinc-600">{log.userName}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400">{log.date}</span>
                      </div>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed italic">"{log.observation}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500 italic text-center py-2">Nenhuma avaliação registrada.</p>
                )}
              </div>
            </section>

            <Separator />

            {/* Histórico */}
            <section className="space-y-4 pb-10">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
                <History className="h-4 w-4 text-emerald-600" />
                <h3>Histórico de Interações</h3>
              </div>
              <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 before:to-transparent">
                {study.history && study.history.length > 0 ? (
                  study.history.map((item, i) => (
                    <div key={i} className="relative flex items-start gap-6 pl-2">
                      <div className="absolute left-0 mt-1.5 h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border shadow-sm z-10">
                        <MessageSquare className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className="flex-1 pt-0.5 ml-10">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold">{item.event}</p>
                          <time className="text-[10px] text-zinc-500">{format(new Date(item.date), 'dd/MM/yyyy')}</time>
                        </div>
                        {item.notes && <p className="text-xs text-zinc-500">{item.notes}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500 italic pl-12">Nenhum histórico registrado.</p>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
