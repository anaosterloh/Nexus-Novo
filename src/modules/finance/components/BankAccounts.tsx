import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Building2, 
  CreditCard, 
  Wallet, 
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Settings2,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const mockAccounts = [
  { id: '1', name: 'Banco Itaú - Principal', type: 'Corrente', bank: 'Itaú Unibanco', balance: 45280.50, lastSync: '2024-03-15 10:30', status: 'active' },
  { id: '2', name: 'Banco Santander - Filial', type: 'Corrente', bank: 'Santander Brasil', balance: 12450.00, lastSync: '2024-03-15 09:15', status: 'active' },
  { id: '3', name: 'Caixa Geral', type: 'Dinheiro', bank: 'Nexus ERP', balance: 1500.00, lastSync: '2024-03-14 18:00', status: 'active' },
  { id: '4', name: 'Cartão Corporativo Visa', type: 'Crédito', bank: 'Banco do Brasil', balance: -3200.40, lastSync: '2024-03-15 11:00', status: 'active' },
];

export function BankAccounts() {
  const { can } = usePermissions();

  if (!can('view_financials')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar contas bancárias.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bancos e Caixas</h2>
          <p className="text-muted-foreground">Gerencie suas contas bancárias, cartões e disponibilidades.</p>
        </div>
        {can('edit_financials') && (
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="h-4 w-4" /> Nova Conta
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockAccounts.map((account) => (
          <Card key={account.id} className="overflow-hidden hover:border-blue-500 transition-colors shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  account.type === 'Dinheiro' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                )}>
                  {account.type === 'Dinheiro' ? <Wallet className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2"><History className="h-4 w-4" /> Extrato</DropdownMenuItem>
                    {can('edit_financials') && (
                      <>
                        <DropdownMenuItem className="gap-2"><ArrowUpRight className="h-4 w-4" /> Transferência</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2"><Settings2 className="h-4 w-4" /> Configurações</DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-4">
                <CardTitle className="text-base font-bold">{account.name}</CardTitle>
                <CardDescription className="text-xs">{account.bank} • {account.type}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Saldo Atual</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-zinc-500">R$</span>
                  <span className={cn(
                    "text-2xl font-black tracking-tight",
                    account.balance >= 0 ? "text-zinc-900" : "text-rose-600"
                  )}>
                    {Math.abs(account.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between text-[10px] text-zinc-500 border-t pt-3">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Sincronizado
                </div>
                <span>{account.lastSync}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase text-zinc-500">Conciliação Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <h4 className="font-bold">Tudo em dia!</h4>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto mt-1">
                Não há lançamentos pendentes de conciliação bancária no momento.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase text-zinc-500">Atalhos Financeiros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {can('edit_financials') && (
              <>
                <Button variant="outline" className="w-full justify-start gap-2 h-12">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" /> Novo Recebimento
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 h-12">
                  <ArrowDownRight className="h-4 w-4 text-rose-500" /> Novo Pagamento
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 h-12">
                  <ArrowRightLeft className="h-4 w-4 text-blue-500" /> Transferência entre Contas
                </Button>
              </>
            )}
            {!can('edit_financials') && (
              <p className="text-sm text-zinc-500 text-center py-4">Acesso restrito a atalhos.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ArrowRightLeft(props: any) {
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
      <path d="m16 3 4 4-4 4" />
      <path d="M20 7H4" />
      <path d="m8 21-4-4 4-4" />
      <path d="M4 17h16" />
    </svg>
  )
}
