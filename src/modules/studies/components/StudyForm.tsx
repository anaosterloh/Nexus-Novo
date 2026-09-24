import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  Plus, 
  Trash2, 
  Globe, 
  Building2, 
  ShieldCheck, 
  Phone, 
  Mail,
  User,
  Beaker,
  Info,
  Calendar,
  History,
  MessageSquare
} from 'lucide-react';
import { productStudySchema, ProductStudy } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface StudyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (study: ProductStudy) => void;
  initialData?: ProductStudy;
}

export function StudyForm({ open, onOpenChange, onSuccess, initialData }: StudyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductStudy>({
    resolver: zodResolver(productStudySchema),
    defaultValues: initialData || {
      productName: '',
      companyName: '',
      origin: 'national',
      definitions: '',
      composition: '',
      usage: '',
      reliability: 'medium',
      internalContact: {
        name: '',
        phones: [''],
        email: '',
      },
      businessObservations: '',
      history: [],
      events: [],
      evaluationLogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  });

  const onSubmit = async (data: ProductStudy) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSuccess({
        ...data,
        id: initialData?.id || Math.random().toString(36).substr(2, 9),
        updatedAt: new Date().toISOString(),
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error('Erro ao salvar estudo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Beaker className="h-6 w-6 text-emerald-600" />
            {initialData ? 'Editar Estudo' : 'Novo Estudo de Produto'}
          </DialogTitle>
          <DialogDescription>
            Registre informações detalhadas, composição, uso e confiabilidade do fornecedor.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-2">
          <form id="study-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Nome do Produto</Label>
                <Input id="productName" placeholder="Ex: Válvula Hidráulica V-200" {...form.register('productName')} />
                {form.formState.errors.productName && <p className="text-xs text-red-500">{form.formState.errors.productName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Empresa / Fabricante</Label>
                <Input id="companyName" placeholder="Ex: HydraTech Solutions" {...form.register('companyName')} />
                {form.formState.errors.companyName && <p className="text-xs text-red-500">{form.formState.errors.companyName.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Origem</Label>
                <Select 
                  value={form.watch('origin')} 
                  onValueChange={(v: any) => form.setValue('origin', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national">Nacional</SelectItem>
                    <SelectItem value="international">Internacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Confiabilidade</Label>
                <Select 
                  value={form.watch('reliability')} 
                  onValueChange={(v: any) => form.setValue('reliability', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="unreliable">Não Confiável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail de Contato</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input id="email" className="pl-10" placeholder="contato@empresa.com" {...form.register('internalContact.email')} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="definitions">Definições / Especificações</Label>
              <Textarea id="definitions" placeholder="Descreva o que é o produto, especificações técnicas..." {...form.register('definitions')} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="composition">Composição / Materiais</Label>
                <Textarea id="composition" placeholder="Do que é feito? Materiais, componentes..." {...form.register('composition')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usage">Uso / Aplicações</Label>
                <Textarea id="usage" placeholder="Onde e como é utilizado?" {...form.register('usage')} />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Agenda e Eventos (Feiras, Reuniões)
              </h3>
              <div className="space-y-3">
                {form.watch('events')?.map((_, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-zinc-50 rounded-lg border items-end">
                    <div className="md:col-span-4 space-y-1">
                      <Label className="text-[10px] uppercase">Título do Evento</Label>
                      <Input placeholder="Ex: Hannover Messe" {...form.register(`events.${index}.title` as any)} />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <Label className="text-[10px] uppercase">Data</Label>
                      <Input type="date" {...form.register(`events.${index}.date` as any)} />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-[10px] uppercase">Tipo</Label>
                      <Select 
                        value={form.watch(`events.${index}.type` as any)} 
                        onValueChange={(v: any) => form.setValue(`events.${index}.type` as any, v)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fair">Feira</SelectItem>
                          <SelectItem value="meeting">Reunião</SelectItem>
                          <SelectItem value="visit">Visita</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-[10px] uppercase">Local</Label>
                      <Input placeholder="Cidade/País" {...form.register(`events.${index}.location` as any)} />
                    </div>
                    <div className="md:col-span-1 flex justify-center">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-rose-500"
                        onClick={() => {
                          const events = form.getValues('events') || [];
                          form.setValue('events', events.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2 border-dashed"
                  onClick={() => {
                    const events = form.getValues('events') || [];
                    form.setValue('events', [...events, { id: Math.random().toString(36).substr(2, 9), title: '', date: '', type: 'meeting' }]);
                  }}
                >
                  <Plus className="h-4 w-4" /> Adicionar Evento à Agenda
                </Button>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <History className="h-4 w-4" /> Histórico de Avaliações / Logs
              </h3>
              <div className="space-y-3">
                {form.watch('evaluationLogs')?.map((_, index) => (
                  <div key={index} className="p-3 bg-zinc-50 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-zinc-400" />
                        <span className="text-[10px] font-bold uppercase">{form.watch(`evaluationLogs.${index}.userName` as any)}</span>
                        <span className="text-[10px] text-zinc-400">{form.watch(`evaluationLogs.${index}.date` as any)}</span>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-rose-500"
                        onClick={() => {
                          const logs = form.getValues('evaluationLogs') || [];
                          form.setValue('evaluationLogs', logs.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-600">{form.watch(`evaluationLogs.${index}.observation` as any)}</p>
                  </div>
                ))}
                
                <div className="p-3 border rounded-lg bg-white dark:bg-zinc-950 space-y-3">
                  <Label className="text-xs font-bold">Nova Observação / Avaliação</Label>
                  <Textarea 
                    id="new-log-obs"
                    placeholder="Adicione uma nova observação ao histórico..." 
                    className="min-h-[80px] text-xs"
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    className="w-full gap-2"
                    onClick={() => {
                      const obsInput = document.getElementById('new-log-obs') as HTMLTextAreaElement;
                      const obs = obsInput?.value;
                      if (!obs) return;
                      
                      const logs = form.getValues('evaluationLogs') || [];
                      form.setValue('evaluationLogs', [
                        ...logs, 
                        { 
                          id: Math.random().toString(36).substr(2, 9), 
                          date: new Date().toLocaleString(), 
                          userName: 'Usuário Atual', // In a real app, get from context
                          observation: obs 
                        }
                      ]);
                      obsInput.value = '';
                    }}
                  >
                    <Plus className="h-3 w-3" /> Registrar Avaliação
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <User className="h-4 w-4" /> Contato Interno e Negócios
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Nome do Contato</Label>
                  <Input id="contactName" placeholder="Nome da pessoa de contato" {...form.register('internalContact.name')} />
                </div>
                <div className="space-y-2">
                  <Label>Telefones</Label>
                  <div className="space-y-2">
                    {form.watch('internalContact.phones')?.map((_, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                          <Input 
                            className="pl-10" 
                            placeholder="(00) 00000-0000" 
                            {...form.register(`internalContact.phones.${index}` as any)} 
                          />
                        </div>
                        {index > 0 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              const phones = form.getValues('internalContact.phones') || [];
                              form.setValue('internalContact.phones', phones.filter((_, i) => i !== index));
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-full gap-2"
                      onClick={() => {
                        const phones = form.getValues('internalContact.phones') || [];
                        form.setValue('internalContact.phones', [...phones, '']);
                      }}
                    >
                      <Plus className="h-3 w-3" /> Adicionar Telefone
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessObservations">Observações de Negócio / Confiabilidade</Label>
                <Textarea 
                  id="businessObservations" 
                  placeholder="Vale a pena fazer negócio? Observações sobre prazos, qualidade, suporte..." 
                  {...form.register('businessObservations')} 
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-zinc-50 dark:bg-zinc-900/50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            form="study-form" 
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 min-w-[150px]"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Estudo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
