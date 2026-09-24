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
  ShieldAlert, 
  Search, 
  Filter, 
  Plus,
  Settings2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ComplianceRule {
  id: string;
  entityType: 'Cliente' | 'Fornecedor' | 'Equipamento' | 'Funcionário';
  context: string; // e.g., 'Manutenção', 'Vendas', 'Integração'
  requiredDocumentCategory: string;
  isBlocking: boolean;
  status: 'Ativo' | 'Inativo';
}

export function ComplianceManager() {
  const [rules] = useState<ComplianceRule[]>([
    {
      id: 'RGL-001',
      entityType: 'Cliente',
      context: 'Abertura de OS (Manutenção)',
      requiredDocumentCategory: 'Contrato',
      isBlocking: true,
      status: 'Ativo'
    },
    {
      id: 'RGL-002',
      entityType: 'Cliente',
      context: 'Vendas / Faturamento',
      requiredDocumentCategory: 'Alvará',
      isBlocking: true,
      status: 'Ativo'
    },
    {
      id: 'RGL-003',
      entityType: 'Funcionário',
      context: 'Acesso ao Laboratório',
      requiredDocumentCategory: 'Treinamento POP-001',
      isBlocking: true,
      status: 'Ativo'
    },
    {
      id: 'RGL-004',
      entityType: 'Fornecedor',
      context: 'Homologação',
      requiredDocumentCategory: 'Certidão Negativa',
      isBlocking: false,
      status: 'Ativo'
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Matriz de Compliance e Obrigatoriedades</h3>
          <p className="text-sm text-zinc-500">Defina quais documentos são obrigatórios para cada operação do sistema.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Nova Regra
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-lg border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 font-medium">Regras Ativas</p>
            <h4 className="text-2xl font-bold">24</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-lg border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 font-medium">Bloqueios Hoje</p>
            <h4 className="text-2xl font-bold">12</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-lg border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 font-medium">Entidades em Conformidade</p>
            <h4 className="text-2xl font-bold">85%</h4>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Buscar regra ou contexto..." className="pl-10" />
        </div>
        <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filtros</Button>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entidade</TableHead>
              <TableHead>Contexto / Operação</TableHead>
              <TableHead>Documento Exigido</TableHead>
              <TableHead>Ação em caso de falta/vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">
                  {rule.entityType}
                </TableCell>
                <TableCell>{rule.context}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-zinc-50 dark:bg-zinc-900">
                    {rule.requiredDocumentCategory}
                  </Badge>
                </TableCell>
                <TableCell>
                  {rule.isBlocking ? (
                    <span className="flex items-center gap-1.5 text-sm text-rose-600 font-medium">
                      <XCircle className="h-4 w-4" /> Bloqueia Operação
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm text-amber-600 font-medium">
                      <ShieldAlert className="h-4 w-4" /> Apenas Alerta
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={rule.status === 'Ativo' ? 'bg-emerald-500' : 'bg-zinc-400'}>
                    {rule.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
