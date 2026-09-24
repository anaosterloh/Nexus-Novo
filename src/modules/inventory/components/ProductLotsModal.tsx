import { useState, useEffect } from 'react';
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
  Package, 
  Search, 
  Filter, 
  Calendar, 
  AlertCircle,
  History,
  Plus,
  MapPin,
  Check
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { toast } from "sonner";
import { LotHistoryModal } from './LotHistoryModal';

interface ProductLotsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

export function ProductLotsModal({ open, onOpenChange, product }: ProductLotsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Formulário de novo lote
  const [newLotNumber, setNewLotNumber] = useState('');
  const [newMfgDate, setNewMfgDate] = useState('');
  const [newExpDate, setNewExpDate] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const fetchLots = () => {
    if (!product?.id) return;
    setLoading(true);
    setErrorMessage(null);
    fetch(`/api/inventory/items/${product.id}/lots`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Erro HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setLots(data.map(l => ({
            id: l.id,
            batchNumber: l.lot_number || l.batchNumber,
            manufactureDate: l.manufacturing_date || l.manufactureDate || null,
            expiryDate: l.expiry_date || l.expiryDate || null,
            quantity: l.quantity ?? 0,
            status: l.status || 'active',
            supplier: l.branch_name || 'Almoxarifado Principal',
            physicalLocation: l.physical_location || ''
          })));
        } else {
          setLots([]);
        }
      })
      .catch((err: any) => {
        setLots([]);
        setErrorMessage(err.message || 'Falha ao buscar lotes no servidor');
        toast.error('Erro ao buscar lotes do produto');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (open && product?.id) {
      fetchLots();
    }
  }, [open, product?.id]);

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLotNumber) {
      toast.error('Informe o número do lote');
      return;
    }

    try {
      const res = await fetch(`/api/inventory/items/${product.id}/lots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lot_number: newLotNumber,
          manufacturing_date: newMfgDate || null,
          expiry_date: newExpDate || null,
          physical_location: newLocation || null,
          status: 'active'
        })
      });

      if (res.ok) {
        toast.success('Lote cadastrado com sucesso!');
        setShowAddForm(false);
        setNewLotNumber('');
        setNewMfgDate('');
        setNewExpDate('');
        setNewLocation('');
        fetchLots();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao salvar lote');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar lote');
    }
  };

  const filteredLots = lots.filter(lot => 
    (lot.batchNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lot.physicalLocation || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewHistory = (lot: any) => {
    setSelectedLot({ ...lot, productName: product?.description });
    setHistoryOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              Gerenciamento de Lotes & Rastreabilidade
            </DialogTitle>
            <DialogDescription>
              Lotes disponíveis para o produto: <span className="font-bold text-zinc-900 dark:text-zinc-100">{product?.description}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between py-2">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar número do lote ou local..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-white"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="h-4 w-4" /> {showAddForm ? 'Fechar Cadastro' : 'Novo Lote'}
              </Button>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {showAddForm && (
            <form onSubmit={handleCreateLot} className="p-3 bg-zinc-50 dark:bg-zinc-900 border rounded-lg space-y-3 mb-2">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cadastrar Novo Lote</div>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-4 space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-zinc-500">Nº do Lote *</Label>
                  <Input 
                    value={newLotNumber} 
                    onChange={e => setNewLotNumber(e.target.value)} 
                    placeholder="Ex: LOT-2026-X" 
                    className="h-8 font-mono text-xs" 
                    required 
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-zinc-500">Fabricação</Label>
                  <Input 
                    type="date" 
                    value={newMfgDate} 
                    onChange={e => setNewMfgDate(e.target.value)} 
                    className="h-8 text-xs" 
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-zinc-500">Validade</Label>
                  <Input 
                    type="date" 
                    value={newExpDate} 
                    onChange={e => setNewExpDate(e.target.value)} 
                    className="h-8 text-xs" 
                  />
                </div>
                <div className="col-span-4 space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-zinc-500">Localização Física</Label>
                  <Input 
                    value={newLocation} 
                    onChange={e => setNewLocation(e.target.value)} 
                    placeholder="Ex: Prateleira B1" 
                    className="h-8 text-xs" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-white">
                  <Check className="h-4 w-4" /> Salvar Lote
                </Button>
              </div>
            </form>
          )}

          <div className="border rounded-md overflow-hidden flex-1">
            <Table>
              <TableHeader className="bg-zinc-100 dark:bg-zinc-800">
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Fabricação</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLots.map((lot) => {
                  let formattedMfg = '-';
                  let formattedExp = '-';
                  try {
                    if (lot.manufactureDate) formattedMfg = format(new Date(lot.manufactureDate), 'dd/MM/yyyy');
                  } catch (e) {}
                  try {
                    if (lot.expiryDate) formattedExp = format(new Date(lot.expiryDate), 'dd/MM/yyyy');
                  } catch (e) {}

                  return (
                    <TableRow key={lot.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <TableCell className="font-mono font-medium text-blue-600">
                        {lot.batchNumber}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-600">
                        {formattedMfg}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-zinc-400" />
                          {formattedExp}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500">
                        {lot.physicalLocation ? (
                          <span className="flex items-center gap-1 font-mono">
                            <MapPin className="h-3 w-3 text-emerald-600" />
                            {lot.physicalLocation}
                          </span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={lot.status === 'active' ? 'outline' : 'destructive'} 
                          className={lot.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                        >
                          {lot.status === 'active' ? 'Ativo' : (lot.status === 'blocked' ? 'Bloqueado' : 'Vencendo')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewHistory(lot)}
                          title="Ver Histórico de Movimentações"
                        >
                          <History className="h-4 w-4 text-blue-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredLots.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                      Nenhum lote cadastrado para este produto.
                    </TableCell>
                  </TableRow>
                )}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-zinc-400">
                      Carregando lotes...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mt-4 flex gap-3 items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-bold mb-1">Fundação de Rastreabilidade Nexus</p>
              <p>O saldo operacional oficial continua sendo mantido e calculado via <strong>stock_balances</strong>. O cadastro de lotes registra os metadados de rastreabilidade (código, datas e localização física) sem criar saldos arbitrários independentes.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedLot && (
        <LotHistoryModal 
          open={historyOpen} 
          onOpenChange={setHistoryOpen} 
          lot={selectedLot} 
        />
      )}
    </>
  );
}
