import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  ArrowRightLeft, 
  Building2, 
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  MoreVertical,
  Check,
  X,
  HelpCircle,
  Lock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'Reconciliado' | 'Pendente' | 'Divergente';
  matchedWith?: string;
}

export function BankReconciliation() {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  if (!can('view_financials')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar a conciliação bancária.</p>
        </div>
      </div>
    );
  }

  const transactions: BankTransaction[] = [
    { 
      id: '1', 
      date: '2024-03-20', 
      description: 'PIX RECEBIDO - HOSPITAL SANTA MARIA', 
      amount: 15200.00, 
      type: 'credit', 
      status: 'Reconciliado', 
      matchedWith: 'REC-1024' 
    },
    { 
      id: '2', 
      date: '2024-03-20', 
      description: 'PAGTO BOLETO - DISTRIB GLOBAL PECAS', 
      amount: 4500.00, 
      type: 'debit', 
      status: 'Pendente' 
    },
    { 
      id: '3', 
      date: '2024-03-21', 
      description: 'TARIFA BANCARIA MENSAL', 
      amount: 45.90, 
      type: 'debit', 
      status: 'Divergente' 
    },
    { 
      id: '4', 
      date: '2024-03-21', 
      description: 'TED RECEBIDA - CLINICA SORRISO', 
      amount: 2450.00, 
      type: 'credit', 
      status: 'Pendente' 
    },
  ];

  const handleReconcile = (id: string) => {
    toast.success('Transação reconciliada manualmente com sucesso!');
  };

  const handleAutoMatch = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Analisando extrato e lançamentos do sistema...',
        success: '12 transações foram conciliadas automaticamente!',
        error: 'Erro ao processar conciliação automática',
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Conciliação Bancária</h2>
          <p className="text-zinc-500">Conferência manual de extratos bancários com os lançamentos do sistema.</p>
        </div>
        {can('edit_financials') && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleAutoMatch}>
              <ArrowRightLeft className="h-4 w-4" /> Conciliação Inteligente
            </Button>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" /> Importar Extrato (OFX/CSV)
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="h-4 w-4" /> Lançamento Avulso
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Saldo Banco</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 152.430,00</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Saldo Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 151.980,00</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-600">Diferença</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">R$ 450,00</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-600">Reconciliado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">94%</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input 
            placeholder="Buscar por descrição, valor ou ID..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" /> Filtros
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Extrato Bancário */}
        <Card>
          <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Extrato Bancário (Manual)</CardTitle>
              </div>
              <Badge variant="outline">Banco do Brasil - 1234-5</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {transactions.map((t) => (
                <div key={t.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                      <span className="text-sm font-medium">{t.description}</span>
                    </div>
                    <span className={cn(
                      "font-bold",
                      t.type === 'credit' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {t.type === 'credit' ? '+' : '-'} {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "text-[10px] font-bold",
                        t.status === 'Reconciliado' ? 'bg-emerald-500' : t.status === 'Divergente' ? 'bg-rose-500' : 'bg-amber-500'
                      )}>
                        {t.status.toUpperCase()}
                      </Badge>
                      {t.matchedWith && (
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Conciliado com {t.matchedWith}
                        </span>
                      )}
                    </div>
                    {t.status !== 'Reconciliado' && can('edit_financials') && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-[10px] font-bold gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleReconcile(t.id)}
                      >
                        <ArrowRightLeft className="h-3 w-3" /> Conciliar Agora
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lançamentos do Sistema */}
        <Card>
          <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-lg">Lançamentos do Sistema</CardTitle>
              </div>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs">Ver todos</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {[
                { id: 'REC-1025', date: '2024-03-21', desc: 'Recebimento Clínica Sorriso', amount: 2450.00, type: 'credit' },
                { id: 'PAG-2050', date: '2024-03-20', desc: 'Pagamento Distribuidora Global', amount: 4500.00, type: 'debit' },
                { id: 'REC-1026', date: '2024-03-22', desc: 'Recebimento Lab BioAnálise', amount: 8900.00, type: 'credit' },
              ].map((s) => (
                <div key={s.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex justify-between items-center">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-400">{s.id}</span>
                      <span className="text-[10px] text-zinc-400">{new Date(s.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <span className="text-sm font-medium">{s.desc}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "font-bold text-sm",
                      s.type === 'credit' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {s.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Check className="h-4 w-4 text-zinc-300 hover:text-emerald-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
