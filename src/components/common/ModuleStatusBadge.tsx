import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type ModuleStatus = 
  | 'Operacional'
  | 'Parcial'
  | 'Visual'
  | 'Em construção'
  | 'Requer configuração'
  | 'Requer integração'
  | 'Planejado';

interface ModuleStatusBadgeProps {
  status: ModuleStatus;
  className?: string;
}

export function ModuleStatusBadge({ status, className }: ModuleStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'Operacional':
        return { color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400', info: 'Integração completa com banco de dados.' };
      case 'Parcial':
        return { color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400', info: 'Partes do sistema estão ativadas, outras usam simulação.' };
      case 'Visual':
        return { color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400', info: 'Interface pronta, aguardando conexão com backend.' };
      case 'Em construção':
        return { color: 'bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300', info: 'Módulo em desenvolvimento ativo.' };
      case 'Requer configuração':
        return { color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400', info: 'Pendências operacionais necessárias para ativar.' };
      case 'Requer integração':
        return { color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400', info: 'Depende de serviços externos ou APIs.' };
      case 'Planejado':
        return { color: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 border-dashed', info: 'Escopo futuro em análise.' };
      default:
        return { color: 'bg-zinc-100 text-zinc-800 border-zinc-300', info: '' };
    }
  };

  const config = getStatusConfig();

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className={cn("inline-flex items-center", className)}>
            <Badge variant="outline" className={cn("text-[10px] font-semibold tracking-wide py-0 cursor-help", config.color)}>
              {status}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent align="end" className="text-xs max-w-[200px]">
          {config.info}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
