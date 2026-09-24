import { useState } from 'react';
import { ShareMenu } from "@/components/shared/ShareMenu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  ClipboardList, 
  Wrench, 
  DollarSign, 
  Clock, 
  User, 
  Settings, 
  Plus, 
  Trash2,
  FileText,
  History,
  CheckCircle2,
  AlertCircle,
  Package,
  CreditCard,
  Search,
  Truck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ServiceOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: any;
}

import { TrackingTimeline, TimelineEvent } from '@/components/ui/TrackingTimeline';

// ... existing imports ...

import { toast } from 'sonner';

// ... existing imports ...

import { usePermissions } from '@/hooks/usePermissions';

export function ServiceOrderForm({ open, onOpenChange, order }: ServiceOrderFormProps) {
  const { can, role } = usePermissions();
  const [activeTab, setActiveTab] = useState(role === 'tech' ? 'solucao' : 'registro');
  const [installments, setInstallments] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('boleto');
  const [numInstallments, setNumInstallments] = useState(1);
  const [firstDueDate, setFirstDueDate] = useState('');
  const [expeditionItems, setExpeditionItems] = useState<any[]>([]);

  const addExpeditionItem = () => {
    setExpeditionItems([...expeditionItems, { itemId: '', quantity: 1, type: 'embalagem', notes: '' }]);
  };

  const removeExpeditionItem = (index: number) => {
    setExpeditionItems(expeditionItems.filter((_, i) => i !== index));
  };

  const updateExpeditionItem = (index: number, field: string, value: any) => {
    const newItems = [...expeditionItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setExpeditionItems(newItems);
  };

  const [services, setServices] = useState<any[]>([
    { id: 'S-005', description: 'Mão de obra técnica especializada', quantity: 1, unitPrice: 250.00, total: 250.00, integrate: false }
  ]);

  const toggleServiceIntegration = (index: number) => {
    const newServices = [...services];
    newServices[index].integrate = !newServices[index].integrate;
    setServices(newServices);
  };

  const handleGenerateFinance = () => {
    if (!firstDueDate) {
      toast.error('Informe a data de vencimento da primeira parcela.');
      return;
    }

    // Calculate total based on integrated items only
    // In a real app, this would sum up parts + services marked for integration
    // For now, we'll use a mock total but respect the integration flag logic
    const integratedServicesTotal = services.filter(s => s.integrate).reduce((acc, s) => acc + s.total, 0);
    const partsTotal = 30.00; // Mock parts total
    
    // If no specific items selected for integration, use full total (default behavior)
    // If items selected, use only those
    const hasIntegratedItems = services.some(s => s.integrate);
    const totalAmount = hasIntegratedItems ? (integratedServicesTotal + (hasIntegratedItems ? 0 : partsTotal)) : 280.00;

    const installmentValue = totalAmount / numInstallments;
    const newInstallments = [];
    const newReceivables = [];

    for (let i = 0; i < numInstallments; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const installment = {
        number: `${i + 1}/${numInstallments}`,
        dueDate: dueDate.toISOString().split('T')[0],
        value: installmentValue,
        status: 'Pendente'
      };
      newInstallments.push(installment);

      newReceivables.push({
        id: `REC-OS-${Math.floor(Math.random() * 10000)}`,
        customer: 'Hospital Santa Maria', // Mock customer
        description: `O.S. #${order?.id || '19454'} - Parc. ${i + 1}/${numInstallments} ${hasIntegratedItems ? '(Parcial)' : ''}`,
        amount: installmentValue,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pending',
        type: paymentMethod === 'boleto' ? 'Boleto' : paymentMethod === 'pix' ? 'PIX' : 'Cartão'
      });
    }

    setInstallments(newInstallments);
    
    // Save to localStorage for integration
    const existing = localStorage.getItem('nexus_new_receivable');
    let allReceivables = existing ? JSON.parse(existing) : [];
    if (!Array.isArray(allReceivables)) allReceivables = [allReceivables];
    
    allReceivables = [...allReceivables, ...newReceivables];
    localStorage.setItem('nexus_new_receivable', JSON.stringify(allReceivables));

    toast.success(`${numInstallments} parcelas geradas e integradas ao financeiro!`);
    
    // Notify admin
    toast.info('Notificação enviada ao Financeiro/Admin sobre a integração.');
  };

  const timelineEvents: TimelineEvent[] = [
    {
      id: '1',
      title: 'Ordem de Serviço Aberta',
      description: 'Abertura realizada por Supervisor.',
      date: '20/03/2024',
      time: '08:30',
      status: 'completed',
      icon: FileText
    },
    {
      id: '2',
      title: 'Aguardando Início do Serviço',
      description: 'Técnico designado, aguardando disponibilidade.',
      date: '20/03/2024',
      time: '09:00',
      status: 'completed',
      icon: Clock
    },
    {
      id: '3',
      title: 'Serviço Iniciado',
      description: 'Início do diagnóstico técnico.',
      date: '20/03/2024',
      time: '09:15',
      status: 'completed',
      icon: Wrench
    },
    {
      id: '4',
      title: 'Solicitada Peça',
      description: 'Peça XXXX não possui suficiente em estoque.',
      date: '20/03/2024',
      time: '10:00',
      status: 'completed',
      icon: Package,
      metadata: [
        { label: 'Peça', value: 'Placa Lógica Principal' },
        { label: 'Localizador', value: 'IKRHFIDK' },
        { label: 'Status', value: 'Indisponível' }
      ]
    },
    {
      id: '5',
      title: 'Peça Solicitada - Aguardando Recebimento',
      description: 'Pedido de compra realizado ao fornecedor.',
      date: '21/03/2024',
      time: '14:00',
      status: 'completed',
      icon: Truck
    },
    {
      id: '6',
      title: 'Serviço Continuado',
      description: 'Peça recebida e instalada.',
      date: '23/03/2024',
      time: '09:00',
      status: 'completed',
      icon: Wrench
    },
    {
      id: '7',
      title: 'Orçamento Finalizado',
      description: 'Cálculo de custos de peças e mão de obra concluído.',
      date: '23/03/2024',
      time: '11:00',
      status: 'completed',
      icon: DollarSign
    },
    {
      id: '8',
      title: 'Orçamento Enviado',
      description: 'Aguardando aprovação do cliente.',
      date: '23/03/2024',
      time: '11:30',
      status: 'current',
      icon: FileText
    },
    {
      id: '9',
      title: 'Orçamento Aprovado',
      description: 'Cliente autorizou a execução.',
      date: '---',
      time: '--:--',
      status: 'pending',
      icon: CheckCircle2
    },
    {
      id: '10',
      title: 'Serviço Finalizado',
      description: 'Equipamento testado e pronto.',
      date: '---',
      time: '--:--',
      status: 'pending',
      icon: CheckCircle2
    },
    {
      id: '11',
      title: 'Aguardando Coleta',
      description: 'Disponível para retirada.',
      date: '---',
      time: '--:--',
      status: 'pending',
      icon: Package
    },
    {
      id: '12',
      title: 'Coleta Realizada',
      description: 'Equipamento retirado pelo cliente.',
      date: '---',
      time: '--:--',
      status: 'pending',
      icon: Truck,
      metadata: [
        { label: 'Coletado por', value: '---' }
      ]
    },
    {
      id: '13',
      title: 'Faturado',
      description: 'Nota fiscal de serviço emitida.',
      date: '---',
      time: '--:--',
      status: 'pending',
      icon: FileText,
      metadata: [
        { label: 'NF Serviço', value: '---' }
      ]
    },
    {
      id: '14',
      title: 'Encerrado',
      description: 'Processo concluído.',
      date: '---',
      time: '--:--',
      status: 'pending',
      icon: CheckCircle2
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                {order ? `Editar O.S. ${order.id}` : 'Nova Ordem de Serviço'}
              </DialogTitle>
              <DialogDescription>
                Preencha os detalhes técnicos, financeiros e de execução da O.S.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Aguardando Diagnóstico
              </Badge>
              <div className="text-xs text-zinc-400 font-mono">Nº 19.454</div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b bg-white dark:bg-zinc-950">
            <TabsList className="bg-transparent h-12 gap-6">
              <TabsTrigger value="registro" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 h-12">
                Registro O.S.
              </TabsTrigger>
              <TabsTrigger value="solucao" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 h-12">
                Solução/Tarefas
              </TabsTrigger>
              <TabsTrigger value="custos" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 h-12">
                Peças e Serviços
              </TabsTrigger>
              <TabsTrigger value="expedicao" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 h-12">
                Expedição & Rastreabilidade
              </TabsTrigger>
              {can('view_financials') && (
                <TabsTrigger value="financeiro" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 h-12">
                  Financeiro
                </TabsTrigger>
              )}
              <TabsTrigger value="etapas" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 h-12">
                Etapas/Histórico
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            <TabsContent value="registro" className="m-0 space-y-6">
              {/* Cliente Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-500 uppercase tracking-wider">
                  <User className="h-4 w-4" /> Dados do Cliente
                </h3>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-8 space-y-2">
                    <Label>Nome Fantasia / Razão Social</Label>
                    <Select disabled={role === 'tech'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Hospital Santa Maria</SelectItem>
                        <SelectItem value="2">Clínica Sorriso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 space-y-2">
                    <Label>Contato</Label>
                    <Input placeholder="Nome do contato" disabled={role === 'tech'} />
                  </div>
                  <div className="col-span-12 space-y-2">
                    <Label>Endereço</Label>
                    <Input placeholder="Endereço completo" disabled />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Equipamento Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-500 uppercase tracking-wider">
                  <Package className="h-4 w-4" /> Equipamento / Objeto
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Marca</Label>
                    <Select disabled={role === 'tech'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a marca..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ge">GE Healthcare</SelectItem>
                        <SelectItem value="philips">Philips</SelectItem>
                        <SelectItem value="siemens">Siemens</SelectItem>
                        <SelectItem value="drager">Dräger</SelectItem>
                        <SelectItem value="mindray">Mindray</SelectItem>
                        <SelectItem value="outra">Outra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Equipamento / Modelo</Label>
                    <Select disabled={role === 'tech'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o equipamento..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monitor">Monitor Multiparamétrico</SelectItem>
                        <SelectItem value="ventilador">Ventilador Pulmonar</SelectItem>
                        <SelectItem value="bomba">Bomba de Infusão</SelectItem>
                        <SelectItem value="desfibrilador">Desfibrilador</SelectItem>
                        <SelectItem value="eletro">Eletrocardiógrafo</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nº de Série / Patrimônio</Label>
                    <Input placeholder="Ex: SN-123456" disabled={role === 'tech'} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <Input placeholder="Ex: Branco" disabled={role === 'tech'} />
                  </div>
                  <div className="space-y-2">
                    <Label>Voltagem</Label>
                    <Select disabled={role === 'tech'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="110">110V</SelectItem>
                        <SelectItem value="220">220V</SelectItem>
                        <SelectItem value="bivolt">Bivolt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado do Aparelho</Label>
                    <Input placeholder="Ex: Bom, com riscos..." disabled={role === 'tech'} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Datas Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-500 uppercase tracking-wider">
                  <Clock className="h-4 w-4" /> Prazos e Datas
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Emissão</Label>
                    <Input type="date" value={new Date().toISOString().split('T')[0]} disabled={role === 'tech'} />
                  </div>
                  <div className="space-y-2">
                    <Label>Previsão Entrega</Label>
                    <Input type="date" disabled={role === 'tech'} />
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select defaultValue="normal" disabled={role === 'tech'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Atendimento</Label>
                    <Select defaultValue="interno" disabled={role === 'tech'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interno">Interno (Laboratório)</SelectItem>
                        <SelectItem value="externo">Visita Externa</SelectItem>
                        <SelectItem value="remoto">Acesso Remoto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Garantia</Label>
                    <Select defaultValue="nao" disabled={role === 'tech'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nao">Não</SelectItem>
                        <SelectItem value="sim">Sim (Coberto)</SelectItem>
                        <SelectItem value="analise">Em Análise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Técnico Responsável</Label>
                    <Select disabled={role === 'tech'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carlos">Carlos Silva</SelectItem>
                        <SelectItem value="ana">Ana Oliveira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="solucao" className="m-0 space-y-6">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label className="font-bold">Problema Relatado / Defeito</Label>
                  <Textarea placeholder="Descreva o problema informado pelo cliente..." className="min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Diagnóstico Técnico / Solução</Label>
                  <Textarea placeholder="Descreva a análise técnica e a solução aplicada..." className="min-h-[150px]" />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold uppercase text-xs text-zinc-500">Tarefas Executadas</Label>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                      <Plus className="h-3 w-3" /> Nova Tarefa
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-50 dark:bg-zinc-900 border-b">
                        <tr>
                          <th className="px-4 py-2 font-bold">Técnico</th>
                          <th className="px-4 py-2 font-bold">Tarefa</th>
                          <th className="px-4 py-2 font-bold">Início</th>
                          <th className="px-4 py-2 font-bold">Fim</th>
                          <th className="px-4 py-2 font-bold text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-4 py-2">Carlos Silva</td>
                          <td className="px-4 py-2">Desmontagem e limpeza</td>
                          <td className="px-4 py-2">20/03 09:00</td>
                          <td className="px-4 py-2">20/03 10:30</td>
                          <td className="px-4 py-2 text-right">
                            <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3" /></Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="custos" className="m-0 space-y-6">
              <div className="space-y-6">
                {/* Peças Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-500 uppercase tracking-wider">
                      <Package className="h-4 w-4" /> Peças / Materiais Utilizados
                    </h3>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                      <Plus className="h-3 w-3" /> Adicionar Peça
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-50 dark:bg-zinc-900 border-b">
                        <tr>
                          <th className="px-4 py-2 font-bold">Cód.</th>
                          <th className="px-4 py-2 font-bold">Descrição</th>
                          <th className="px-4 py-2 font-bold text-right">Qtd</th>
                          {role !== 'tech' && <th className="px-4 py-2 font-bold text-right">Unitário</th>}
                          {role !== 'tech' && <th className="px-4 py-2 font-bold text-right">Total</th>}
                          <th className="px-4 py-2 font-bold text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-4 py-2 font-mono">P-102</td>
                          <td className="px-4 py-2">Fusível de Proteção 10A</td>
                          <td className="px-4 py-2 text-right">2</td>
                          {role !== 'tech' && <td className="px-4 py-2 text-right">R$ 15,00</td>}
                          {role !== 'tech' && <td className="px-4 py-2 text-right font-bold">R$ 30,00</td>}
                          <td className="px-4 py-2 text-right">
                            <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3" /></Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Serviços Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-500 uppercase tracking-wider">
                      <Wrench className="h-4 w-4" /> Serviços Executados
                    </h3>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                      <Plus className="h-3 w-3" /> Adicionar Serviço
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-50 dark:bg-zinc-900 border-b">
                        <tr>
                          <th className="px-4 py-2 font-bold">Cód.</th>
                          <th className="px-4 py-2 font-bold">Descrição do Serviço</th>
                          <th className="px-4 py-2 font-bold text-right">Qtd</th>
                          <th className="px-4 py-2 font-bold text-right">Valor</th>
                          <th className="px-4 py-2 font-bold text-right">Total</th>
                          <th className="px-4 py-2 font-bold text-center">Integrar</th>
                          <th className="px-4 py-2 font-bold text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {services.map((service, index) => (
                          <tr key={service.id}>
                            <td className="px-4 py-2 font-mono">{service.id}</td>
                            <td className="px-4 py-2">{service.description}</td>
                            <td className="px-4 py-2 text-right">{service.quantity}</td>
                            <td className="px-4 py-2 text-right">R$ {service.unitPrice.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-bold">R$ {service.total.toFixed(2)}</td>
                            <td className="px-4 py-2 text-center">
                              <input 
                                type="checkbox" 
                                checked={service.integrate} 
                                onChange={() => toggleServiceIntegration(index)}
                                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3" /></Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Card className="w-64 bg-zinc-50 dark:bg-zinc-900/50">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Total Peças:</span>
                        <span>R$ 30,00</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Total Serviços:</span>
                        <span>R$ 250,00</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>TOTAL:</span>
                        <span className="text-emerald-600">R$ 280,00</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="expedicao" className="m-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Materiais de Expedição & Embalagem</h3>
                    <p className="text-xs text-zinc-400">Vincule embalagens, etiquetas e sacos que serão consumidos do estoque ao enviar este equipamento.</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={addExpeditionItem}
                  >
                    <Plus className="mr-2 h-3 w-3" /> Adicionar Material
                  </Button>
                </div>

                <div className="space-y-3">
                  {expeditionItems.map((item, index) => (
                    <div key={index} className="bg-zinc-50 p-4 rounded-lg border dark:bg-zinc-900/50 relative group">
                      <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-5 space-y-1">
                          <Label className="text-[9px] uppercase font-bold text-zinc-400">Material / Item</Label>
                          <Input 
                            placeholder="Buscar embalagem/etiqueta..."
                            value={item.itemId}
                            onChange={(e) => updateExpeditionItem(index, 'itemId', e.target.value)}
                            className="h-9"
                          />
                        </div>

                        <div className="col-span-2 space-y-1">
                          <Label className="text-[9px] uppercase font-bold text-zinc-400">Tipo</Label>
                          <Select 
                            value={item.type}
                            onValueChange={(v) => updateExpeditionItem(index, 'type', v)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="embalagem">Embalagem</SelectItem>
                              <SelectItem value="etiqueta">Etiqueta</SelectItem>
                              <SelectItem value="acessorio">Acessório</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2 space-y-1">
                          <Label className="text-[9px] uppercase font-bold text-zinc-400">Qtd.</Label>
                          <Input 
                            type="number" 
                            step="0.01" 
                            className="h-9"
                            value={item.quantity}
                            onChange={(e) => updateExpeditionItem(index, 'quantity', parseFloat(e.target.value))}
                          />
                        </div>

                        <div className="col-span-2 space-y-1">
                          <Label className="text-[9px] uppercase font-bold text-zinc-400">Lote/Obs</Label>
                          <Input 
                            placeholder="Lote ou obs."
                            className="h-9"
                            value={item.notes}
                            onChange={(e) => updateExpeditionItem(index, 'notes', e.target.value)}
                          />
                        </div>

                        <div className="col-span-1 flex justify-center">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => removeExpeditionItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {expeditionItems.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg text-zinc-400 bg-zinc-50/50">
                      Nenhum material de expedição vinculado.
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mt-4 dark:bg-blue-900/10 dark:border-blue-900/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-400">Rastreabilidade Avançada (POP)</p>
                      <p className="text-xs text-blue-800 dark:text-blue-300">
                        Os itens listados aqui não serão cobrados do cliente, mas serão baixados do estoque no momento da expedição.
                        Em caso de devolução, o sistema perguntará se estes materiais devem retornar ao estoque ou ser descartados.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {can('view_financials') && (
              <TabsContent value="financeiro" className="m-0 space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  {/* ... content ... */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-500 uppercase tracking-wider">
                      <CreditCard className="h-4 w-4" /> Opções de Pagamento
                    </h3>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Forma de Pagamento</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="boleto">Boleto Bancário</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                            <SelectItem value="faturado">Faturado (30 dias)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Nº de Parcelas</Label>
                          <Input 
                            type="number" 
                            value={numInstallments} 
                            onChange={(e) => setNumInstallments(Number(e.target.value))}
                            min={1}
                            max={12}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Vencimento 1ª</Label>
                          <Input 
                            type="date" 
                            value={firstDueDate}
                            onChange={(e) => setFirstDueDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button className="w-full gap-2" onClick={handleGenerateFinance}>
                        <DollarSign className="h-4 w-4" /> Gerar Financeiro
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-500 uppercase tracking-wider">
                      <FileText className="h-4 w-4" /> Parcelas Geradas
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b">
                          <tr>
                            <th className="px-4 py-2 font-bold">Parc.</th>
                            <th className="px-4 py-2 font-bold">Vencimento</th>
                            <th className="px-4 py-2 font-bold text-right">Valor</th>
                            <th className="px-4 py-2 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {installments.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                                Nenhuma parcela gerada
                              </td>
                            </tr>
                          ) : (
                            installments.map((inst, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-2">{inst.number}</td>
                                <td className="px-4 py-2">{new Date(inst.dueDate).toLocaleDateString('pt-BR')}</td>
                                <td className="px-4 py-2 text-right">
                                  {inst.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td className="px-4 py-2">
                                  <Badge variant="outline" className="text-[10px]">{inst.status}</Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}

            <TabsContent value="etapas" className="m-0 space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-500 uppercase tracking-wider">
                    <History className="h-4 w-4" /> Histórico de Status e Etapas
                  </h3>
                  <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                    <Plus className="h-3 w-3" /> Adicionar Evento Manual
                  </Button>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border p-6">
                  <TrackingTimeline events={timelineEvents} />
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {order && <ShareMenu data={order} type="os" />}
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" /> Laudo Técnico
              </Button>
              <Button variant="outline" className="gap-2">
                <History className="h-4 w-4" /> Log de Alterações
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <CheckCircle2 className="h-4 w-4" /> Salvar O.S.
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
