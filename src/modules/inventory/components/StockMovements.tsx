import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StockEntryForm } from './StockEntryForm';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Filter, 
  ArrowRightLeft, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  MoreHorizontal,
  Eye,
  User,
  Package,
  Truck,
  FileText,
  Building2,
  Clock,
  ShieldCheck,
  RefreshCcw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';

const mockMovements = [
  { 
    id: '1', 
    date: '26/02/2024 14:30', 
    type: 'Saída', 
    product: 'Placa Mãe Industrial v3', 
    qty: 2, 
    user: 'Ricardo Oliveira', 
    reason: 'Ordem de Serviço #4521', 
    status: 'Concluído',
    traceability: {
      supplier: 'Tech Solutions Ltda',
      purchaseInvoice: 'NF-e 001.542',
      importCompany: 'Global Imports SA',
      deliveryDate: '15/01/2024',
      manufacturingDate: '10/12/2023',
      expirationDate: 'N/A',
      registry: 'ANVISA 123456789',
      salesDate: '26/02/2024',
      customer: 'Hospital Santa Maria',
      salesInvoice: 'NF-e 004.899',
      transportMethod: 'Logística Brasil (Rodoviário)',
      returnInfo: null
    }
  },
  { 
    id: '2', 
    date: '26/02/2024 11:15', 
    type: 'Entrada', 
    product: 'Sensor de Pressão 500bar', 
    qty: 10, 
    user: 'Ana Paula Santos', 
    reason: 'Compra NF-e 001.542', 
    status: 'Concluído',
    traceability: {
      supplier: 'Sensores Avançados Ind.',
      purchaseInvoice: 'NF-e 001.542',
      importCompany: 'N/A (Nacional)',
      deliveryDate: '26/02/2024',
      manufacturingDate: '05/02/2024',
      expirationDate: '05/02/2029',
      registry: 'INMETRO 98765',
      salesDate: null,
      customer: null,
      salesInvoice: null,
      transportMethod: 'Correios SEDEX',
      returnInfo: null
    }
  },
  { 
    id: '3', 
    date: '25/02/2024 16:45', 
    type: 'Devolução', 
    product: 'Cabo Blindado 4 vias (m)', 
    qty: 50, 
    user: 'Marcos Vinícius', 
    reason: 'Devolução Cliente', 
    status: 'Concluído',
    traceability: {
      supplier: 'Cabos & Fios SA',
      purchaseInvoice: 'NF-e 008.112',
      importCompany: 'N/A',
      deliveryDate: '10/01/2024',
      manufacturingDate: '01/12/2023',
      expirationDate: 'N/A',
      registry: 'ISO 9001',
      salesDate: '20/02/2024',
      customer: 'Clínica Sorriso',
      salesInvoice: 'NF-e 004.850',
      transportMethod: 'Retirada no Local',
      returnInfo: {
        returnInvoice: 'NF-e 004.851 (Devolução)',
        returnMethod: 'Logística Reversa Correios',
        conference: 'Conferido por Marcos Vinícius - Embalagem intacta, retornou ao estoque.',
        exchangeInvoice: null
      }
    }
  },
];

export function StockMovements() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Movimentações de Estoque</h2>
          <p className="text-muted-foreground">Rastreabilidade completa de todas as entradas, saídas e transferências de produtos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Transferência
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => setIsEntryModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Movimentação
          </Button>
        </div>
      </div>

      <StockEntryForm 
        open={isEntryModalOpen} 
        onOpenChange={setIsEntryModalOpen} 
        onSuccess={() => {
          // Refresh list
        }} 
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Buscar por produto, usuário ou motivo..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm">
          <Calendar className="mr-2 h-4 w-4" /> Período
        </Button>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead className="text-[10px] uppercase font-bold">Data/Hora</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Tipo</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Produto</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center">Qtd</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Usuário</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Motivo / Documento</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Status</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMovements.map((mov) => (
                <TableRow key={mov.id} className="hover:bg-zinc-50/50 transition-colors">
                  <TableCell className="text-zinc-500 text-xs">{mov.date}</TableCell>
                  <TableCell>
                    {mov.type === 'Entrada' ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 gap-1">
                        <ArrowUpRight className="h-3 w-3" /> Entrada
                      </Badge>
                    ) : mov.type === 'Saída' ? (
                      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200 gap-1">
                        <ArrowDownRight className="h-3 w-3" /> Saída
                      </Badge>
                    ) : mov.type === 'Devolução' ? (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 gap-1">
                        <RefreshCcw className="h-3 w-3" /> Devolução
                      </Badge>
                    ) : mov.type === 'Transferência' ? (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 gap-1">
                        <ArrowRightLeft className="h-3 w-3" /> Transf.
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <ArrowRightLeft className="h-3 w-3" /> Ajuste
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3 text-zinc-400" />
                      <span className="font-medium">{mov.product}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    <span className={mov.qty > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {mov.qty > 0 ? `+${mov.qty}` : mov.qty}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-zinc-600">
                      <User className="h-3 w-3" />
                      {mov.user}
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-500 text-xs">{mov.reason}</TableCell>
                  <TableCell>
                    <Badge variant={mov.status === 'Concluído' ? 'outline' : 'secondary'} className="text-[9px]">
                      {mov.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => setSelectedMovement(mov)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMovement} onOpenChange={(open) => !open && setSelectedMovement(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Rastreabilidade Completa (POP)
            </DialogTitle>
            <DialogDescription>
              Histórico detalhado do item desde a entrada até a saída/devolução.
            </DialogDescription>
          </DialogHeader>

          {selectedMovement && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border">
                <div>
                  <p className="text-sm font-bold">{selectedMovement.product}</p>
                  <p className="text-xs text-zinc-500">Movimentação: {selectedMovement.date} • {selectedMovement.type}</p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-1">
                  Qtd: {selectedMovement.qty > 0 ? `+${selectedMovement.qty}` : selectedMovement.qty}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-zinc-500 uppercase tracking-wider border-b pb-2">
                    <Building2 className="h-4 w-4" /> Origem / Compra
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-zinc-500">Fornecedor:</span> <span className="font-medium">{selectedMovement.traceability.supplier}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">NF Compra:</span> <span className="font-medium">{selectedMovement.traceability.purchaseInvoice}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Importadora:</span> <span className="font-medium">{selectedMovement.traceability.importCompany}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Data Entrega:</span> <span className="font-medium">{selectedMovement.traceability.deliveryDate}</span></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-zinc-500 uppercase tracking-wider border-b pb-2">
                    <Clock className="h-4 w-4" /> Produto / Lote
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-zinc-500">Fabricação:</span> <span className="font-medium">{selectedMovement.traceability.manufacturingDate}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Validade:</span> <span className="font-medium">{selectedMovement.traceability.expirationDate}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Registro:</span> <span className="font-medium">{selectedMovement.traceability.registry}</span></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-zinc-500 uppercase tracking-wider border-b pb-2">
                    <User className="h-4 w-4" /> Destino / Venda
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-zinc-500">Cliente:</span> <span className="font-medium">{selectedMovement.traceability.customer || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Data Venda:</span> <span className="font-medium">{selectedMovement.traceability.salesDate || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">NF Venda:</span> <span className="font-medium">{selectedMovement.traceability.salesInvoice || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Transporte:</span> <span className="font-medium">{selectedMovement.traceability.transportMethod || '-'}</span></div>
                  </div>
                </div>

                {selectedMovement.traceability.returnInfo && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold flex items-center gap-2 text-amber-600 uppercase tracking-wider border-b border-amber-200 pb-2">
                      <RefreshCcw className="h-4 w-4" /> Devolução / Troca
                    </h4>
                    <div className="space-y-2 text-sm bg-amber-50 p-3 rounded-lg border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30">
                      <div className="flex justify-between"><span className="text-amber-700">NF Devolução:</span> <span className="font-bold text-amber-900 dark:text-amber-400">{selectedMovement.traceability.returnInfo.returnInvoice}</span></div>
                      <div className="flex justify-between"><span className="text-amber-700">Transporte Retorno:</span> <span className="font-medium text-amber-900 dark:text-amber-400">{selectedMovement.traceability.returnInfo.returnMethod}</span></div>
                      <div className="flex justify-between"><span className="text-amber-700">NF Troca:</span> <span className="font-medium text-amber-900 dark:text-amber-400">{selectedMovement.traceability.returnInfo.exchangeInvoice || 'N/A'}</span></div>
                      <div className="mt-2 pt-2 border-t border-amber-200">
                        <span className="text-amber-700 text-xs font-bold block mb-1">Conferência:</span>
                        <p className="text-xs text-amber-900 dark:text-amber-400">{selectedMovement.traceability.returnInfo.conference}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
