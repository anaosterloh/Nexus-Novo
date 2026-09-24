import { useState } from 'react';
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
  FileSignature, 
  Search, 
  Filter, 
  Eye, 
  RefreshCw,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Document, DocumentStatus } from '../types';
import { Progress } from '@/components/ui/progress';

export function ContractManager() {
  const [contracts] = useState<Document[]>([
    {
      id: 'CTR-2024-001',
      title: 'Contrato de Manutenção Preventiva',
      type: 'Contrato',
      category: 'Comercial',
      status: 'Vigente',
      content: '...',
      createdBy: 'Ana Paula',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15',
      validFrom: '2024-01-15',
      validUntil: '2025-01-15',
      version: '1.0',
      clientId: 'CLI-001', // Link to client
      contractDetails: {
        valorTotal: 15000,
        limiteMensal: 10,
        saldoServicos: 2, // 8 used, 2 remaining
        diaFaturamento: 5,
        renovacaoAutomatica: true
      }
    },
    {
      id: 'CTR-2023-089',
      title: 'Prestação de Serviços de TI',
      type: 'Contrato',
      category: 'Comercial',
      status: 'Vencido',
      content: '...',
      createdBy: 'Carlos Silva',
      createdAt: '2023-02-10',
      updatedAt: '2023-02-10',
      validFrom: '2023-02-10',
      validUntil: '2024-02-10',
      version: '2.1',
      clientId: 'CLI-045',
      contractDetails: {
        valorTotal: 8500,
        limiteMensal: 0, // unlimited or not applicable
        saldoServicos: 0,
        diaFaturamento: 15,
        renovacaoAutomatica: false
      }
    },
    {
      id: 'CTR-2024-042',
      title: 'Locação de Equipamentos Médicos',
      type: 'Contrato',
      category: 'Comercial',
      status: 'Em Revisão',
      content: '...',
      createdBy: 'Ana Paula',
      createdAt: '2024-03-01',
      updatedAt: '2024-03-08',
      validFrom: '2024-03-10',
      validUntil: '2025-03-10',
      version: '1.2',
      clientId: 'CLI-012',
      contractDetails: {
        valorTotal: 45000,
        limiteMensal: 5,
        saldoServicos: 5,
        diaFaturamento: 1,
        renovacaoAutomatica: true
      }
    }
  ]);

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'Vigente': return 'bg-emerald-500 hover:bg-emerald-600';
      case 'Em Revisão': return 'bg-amber-500 hover:bg-amber-600';
      case 'Vencido': return 'bg-rose-500 hover:bg-rose-600';
      default: return 'bg-zinc-400 hover:bg-zinc-500';
    }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getDaysUntilExpiration = (validUntil?: string) => {
    if (!validUntil) return null;
    const diff = new Date(validUntil).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gestão de Contratos (CLM)</h3>
          <p className="text-sm text-zinc-500">Acompanhe vigências, saldos e renovações de contratos.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Novo Contrato
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-lg border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full">
            <FileSignature className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 font-medium">Contratos Ativos</p>
            <h4 className="text-2xl font-bold">124</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-lg border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 font-medium">Vencendo em 30 dias</p>
            <h4 className="text-2xl font-bold">8</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-lg border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 font-medium">Contratos Vencidos</p>
            <h4 className="text-2xl font-bold">3</h4>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Buscar por cliente ou número..." className="pl-10" />
        </div>
        <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filtros Avançados</Button>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contrato / Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor Global</TableHead>
              <TableHead>Consumo (Mês)</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => {
              const daysLeft = getDaysUntilExpiration(contract.validUntil);
              const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 30;
              
              const limit = contract.contractDetails?.limiteMensal || 0;
              const remaining = contract.contractDetails?.saldoServicos || 0;
              const used = limit - remaining;
              const usagePercent = limit > 0 ? (used / limit) * 100 : 0;

              return (
                <TableRow key={contract.id}>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      <FileSignature className="h-4 w-4 text-zinc-500" />
                      {contract.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1 ml-6">
                      <span className="text-xs text-zinc-500">Cliente ID: {contract.clientId}</span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1">v{contract.version}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(contract.status)}>{contract.status}</Badge>
                    {isExpiringSoon && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-600 mt-1 font-medium">
                        <AlertCircle className="h-3 w-3" /> Vence em {daysLeft} dias
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(contract.contractDetails?.valorTotal)}
                  </TableCell>
                  <TableCell>
                    {limit > 0 ? (
                      <div className="w-32 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">{used} usados</span>
                          <span className="font-medium">{remaining} restam</span>
                        </div>
                        <Progress value={usagePercent} className={`h-1.5 ${usagePercent >= 90 ? 'bg-rose-100' : ''}`} />
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">Ilimitado / N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={`text-sm ${contract.status === 'Vencido' ? 'text-rose-600 font-medium' : ''}`}>
                        {contract.validUntil ? new Date(contract.validUntil).toLocaleDateString() : '-'}
                      </span>
                      {contract.contractDetails?.renovacaoAutomatica && (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
                          <RefreshCw className="h-3 w-3" /> Auto-renovável
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver Detalhes">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Renovar / Aditivo">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
