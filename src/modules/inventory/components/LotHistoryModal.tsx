import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  PlusCircle, 
  XCircle, 
  AlertTriangle,
  Printer,
  Download,
  FileText,
  User
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LotMovement {
  id: string;
  date: string;
  type: 'in' | 'out' | 'return' | 'loss' | 'internal';
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  user: string;
  document?: string; // NF, Pedido, OS
  entity?: string; // Cliente ou Fornecedor
  notes?: string;
}

interface LotHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lot: any;
}

export function LotHistoryModal({ open, onOpenChange, lot }: LotHistoryModalProps) {
  // Mock movements data
  const movements: LotMovement[] = [
    {
      id: 'MOV-001',
      date: '2024-03-01T10:00:00',
      type: 'in',
      quantity: 100,
      balanceBefore: 0,
      balanceAfter: 100,
      user: 'João Silva',
      document: 'NF-12345',
      entity: 'Fornecedor ABC Ltda',
      notes: 'Entrada inicial de compra'
    },
    {
      id: 'MOV-002',
      date: '2024-03-05T14:30:00',
      type: 'out',
      quantity: 10,
      balanceBefore: 100,
      balanceAfter: 90,
      user: 'Maria Souza',
      document: 'OS-19454',
      entity: 'Hospital Santa Maria',
      notes: 'Saída para manutenção'
    },
    {
      id: 'MOV-003',
      date: '2024-03-10T09:15:00',
      type: 'return',
      quantity: 2,
      balanceBefore: 90,
      balanceAfter: 92,
      user: 'Carlos Oliveira',
      document: 'DEV-001',
      entity: 'Hospital Santa Maria',
      notes: 'Devolução de sobra de material'
    },
    {
      id: 'MOV-004',
      date: '2024-03-12T16:00:00',
      type: 'internal',
      quantity: 1,
      balanceBefore: 92,
      balanceAfter: 91,
      user: 'Ana Santos',
      notes: 'Teste de qualidade interno'
    },
    {
      id: 'MOV-005',
      date: '2024-03-15T11:00:00',
      type: 'loss',
      quantity: 1,
      balanceBefore: 91,
      balanceAfter: 90,
      user: 'João Silva',
      notes: 'Avaria no armazenamento'
    }
  ];

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <PlusCircle className="h-5 w-5 text-blue-600" />;
      case 'out':
        return <ArrowUpCircle className="h-5 w-5 text-emerald-600" />;
      case 'return':
        return <ArrowDownCircle className="h-5 w-5 text-amber-600" />; // Usando amber para retorno/devolução ao estoque
      case 'loss':
        return <XCircle className="h-5 w-5 text-rose-600" />;
      case 'internal':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <PlusCircle className="h-5 w-5" />;
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'in': return 'Entrada (Compra)';
      case 'out': return 'Saída (Venda/OS)';
      case 'return': return 'Devolução';
      case 'loss': return 'Perda/Descarte';
      case 'internal': return 'Uso Interno';
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-zinc-500" />
                Rastreabilidade do Lote: <span className="font-mono text-blue-600">{lot?.batchNumber}</span>
              </DialogTitle>
              <DialogDescription>
                Histórico completo de movimentações deste lote.
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Printer className="h-4 w-4" /> Imprimir
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" /> Exportar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4 py-4 border-y bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg">
          <div>
            <span className="text-xs font-bold text-zinc-500 uppercase">Produto</span>
            <p className="font-medium truncate">{lot?.productName || 'Produto Exemplo'}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-500 uppercase">Validade</span>
            <p className="font-medium font-mono">{lot?.expiryDate ? format(new Date(lot.expiryDate), 'dd/MM/yyyy') : '-'}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-500 uppercase">Fabricação</span>
            <p className="font-medium font-mono">{lot?.manufactureDate ? format(new Date(lot.manufactureDate), 'dd/MM/yyyy') : '-'}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-500 uppercase">Saldo Atual</span>
            <p className="font-bold text-lg text-emerald-600">{lot?.quantity} UN</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader className="bg-zinc-100 dark:bg-zinc-800 sticky top-0">
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>Documento / Entidade</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((mov) => (
                <TableRow key={mov.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <TableCell>
                    {getMovementIcon(mov.type)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {format(new Date(mov.date), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{getMovementLabel(mov.type)}</span>
                      {mov.notes && <span className="text-[10px] text-zinc-500">{mov.notes}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs">{mov.entity || '-'}</span>
                      {mov.document && (
                        <Badge variant="outline" className="w-fit text-[10px] h-5 px-1 mt-1">
                          {mov.document}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {mov.type === 'in' || mov.type === 'return' ? (
                      <span className="text-blue-600">+{mov.quantity}</span>
                    ) : (
                      <span className="text-rose-600">-{mov.quantity}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    <div className="flex flex-col items-end">
                      <span className="text-zinc-400 line-through text-[10px]">{mov.balanceBefore}</span>
                      <span className="font-bold">{mov.balanceAfter}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-zinc-400" />
                      <span className="text-xs">{mov.user}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
