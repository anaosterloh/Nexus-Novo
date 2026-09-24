import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  MoreVertical, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  User, 
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { OpportunityForm } from './OpportunityForm';
import { Lock } from 'lucide-react';

interface Lead {
  id: string;
  title: string;
  company: string;
  value: number;
  probability: number;
  daysInStage: number;
  lastActivity: string;
  priority: 'low' | 'medium' | 'high';
}

interface Stage {
  id: string;
  title: string;
  leads: Lead[];
}

export function SalesFunnel() {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!can('view_sales')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar o funil de vendas.</p>
        </div>
      </div>
    );
  }

  const [stages, setStages] = useState<Stage[]>([
    {
      id: 'prospecting',
      title: 'Prospecção',
      leads: [
        { id: '1', title: 'Expansão de TI', company: 'Hospital Santa Maria', value: 45000, probability: 20, daysInStage: 5, lastActivity: '24/02', priority: 'high' },
        { id: '2', title: 'Manutenção Preventiva', company: 'Clínica Sorriso', value: 12000, probability: 10, daysInStage: 2, lastActivity: '26/02', priority: 'medium' },
      ]
    },
    {
      id: 'qualification',
      title: 'Qualificação',
      leads: [
        { id: '3', title: 'Novos Sensores', company: 'Indústria Metalúrgica', value: 85000, probability: 40, daysInStage: 12, lastActivity: '20/02', priority: 'high' },
      ]
    },
    {
      id: 'proposal',
      title: 'Proposta',
      leads: [
        { id: '4', title: 'Upgrade de Software', company: 'Laboratório BioAnálise', value: 28000, probability: 60, daysInStage: 3, lastActivity: '25/02', priority: 'medium' },
        { id: '5', title: 'Consultoria Técnica', company: 'Prefeitura Municipal', value: 150000, probability: 50, daysInStage: 20, lastActivity: '15/02', priority: 'low' },
      ]
    },
    {
      id: 'negotiation',
      title: 'Negociação',
      leads: [
        { id: '6', title: 'Contrato Anual', company: 'Condomínio Solar', value: 64000, probability: 80, daysInStage: 7, lastActivity: '22/02', priority: 'high' },
      ]
    },
    {
      id: 'closed',
      title: 'Fechado',
      leads: [
        { id: '7', title: 'Instalação de Redes', company: 'Escola Educar', value: 32000, probability: 100, daysInStage: 1, lastActivity: '27/02', priority: 'medium' },
      ]
    }
  ]);

  const handleAddOpportunity = (data: any) => {
    const newLead: Lead = {
      id: Math.random().toString(36).substr(2, 9),
      title: data.title,
      company: data.company,
      value: data.value,
      probability: 20,
      daysInStage: 0,
      lastActivity: 'Hoje',
      priority: data.priority
    };

    setStages(prev => prev.map(stage => {
      if (stage.id === 'prospecting') {
        return { ...stage, leads: [newLead, ...stage.leads] };
      }
      return stage;
    }));
  };

  const getPriorityColor = (priority: Lead['priority']) => {
    switch (priority) {
      case 'high': return 'bg-rose-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Funil de Vendas (CRM)</h2>
          <p className="text-zinc-500">Gerencie suas oportunidades e acompanhe o progresso comercial.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <TrendingUp className="h-4 w-4" /> Relatórios CRM
          </Button>
          {can('edit_sales') && (
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="h-4 w-4" /> Nova Oportunidade
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input 
            placeholder="Buscar por título, empresa ou valor..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" /> Filtros
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:overflow-x-auto pb-6 lg:-mx-6 lg:px-6">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-full lg:w-[300px] space-y-4">
            <div className="flex items-center justify-between px-2 bg-zinc-50/50 dark:bg-zinc-800/20 py-2 rounded-lg lg:bg-transparent lg:py-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500">{stage.title}</h3>
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{stage.leads.length}</Badge>
              </div>
              {can('edit_sales') && (
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4 text-zinc-400" />
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {stage.leads.map((lead) => (
                <Card key={lead.id} className="group hover:shadow-md transition-all cursor-grab active:cursor-grabbing border-zinc-200 dark:border-zinc-800">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">{lead.title}</span>
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {lead.company}
                        </span>
                      </div>
                      <div className={cn("h-2 w-2 rounded-full", getPriorityColor(lead.priority))} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                          {lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500" 
                              style={{ width: `${lead.probability}%` }}
                            />
                          </div>
                          <span className="text-[8px] font-bold text-emerald-600">{lead.probability}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {lead.daysInStage} dias
                        </span>
                        <span className="text-[10px] text-zinc-400">Última: {lead.lastActivity}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex -space-x-2">
                        <div className="h-6 w-6 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-100 flex items-center justify-center text-[8px] font-bold">JD</div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <OpportunityForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSuccess={handleAddOpportunity} 
      />
    </div>
  );
}
