import React, { useState, useEffect } from 'react';
import { Package, CheckCircle2, Clock, AlertCircle, X, ChevronRight, Layers, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface PickingAllocation {
  id: string;
  reservationId: string;
  positionId: string;
  locationName: string;
  locationCode?: string;
  lotId?: string | null;
  lotNumber?: string | null;
  serialId?: string | null;
  serialNumber?: string | null;
  quantity: number;
  status: string;
  pickedBy?: string | null;
  pickedAt?: string | null;
}

interface PickingItem {
  reservationId: string;
  itemId: string;
  itemCode: string;
  itemDescription: string;
  tracksBatch: boolean;
  tracksSerial: boolean;
  requiredQuantity: number;
  pickedQuantity: number;
  remainingQuantity: number;
  status: 'not_started' | 'partial' | 'complete';
  allocations: PickingAllocation[];
}

interface OrderPickingSummary {
  orderId: string;
  status: string;
  stockFlowMode?: string;
  items: PickingItem[];
  canShip: boolean;
  allComplete: boolean;
  totalRequired: number;
  totalPicked: number;
}

interface PositionOption {
  positionId: string;
  locationId: string;
  locationName: string;
  locationCode?: string;
  physicalQuantity: number;
  allocatedQuantity: number;
  availableForPicking: number;
  lotId?: string | null;
  lotNumber?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  lotStatus?: string | null;
}

interface SerialOption {
  serialId: string;
  serialNumber: string;
  lotId?: string | null;
  lotNumber?: string | null;
  positionId?: string | null;
  locationName?: string | null;
  status: string;
}

interface PickingPanelProps {
  orderId: string;
  orderStatus: string;
  isLegacy: boolean;
  onPickingUpdated?: () => void;
}

export function PickingPanel({ orderId, orderStatus, isLegacy, onPickingUpdated }: PickingPanelProps) {
  const [summary, setSummary] = useState<OrderPickingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeReservation, setActiveReservation] = useState<PickingItem | null>(null);

  // Modal / Form de separação
  const [positionOptions, setPositionOptions] = useState<PositionOption[]>([]);
  const [serialOptions, setSerialOptions] = useState<SerialOption[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [selectedSerialId, setSelectedSerialId] = useState<string>('');
  const [allocationQuantity, setAllocationQuantity] = useState<number>(1);
  const [savingAllocation, setSavingAllocation] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sales/orders/${orderId}/picking`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [orderId]);

  const openAllocateModal = async (item: PickingItem) => {
    setActiveReservation(item);
    setSelectedPositionId('');
    setSelectedSerialId('');
    setAllocationQuantity(item.tracksSerial ? 1 : item.remainingQuantity || 1);

    try {
      const res = await fetch(`/api/sales/orders/${orderId}/picking/options?reservationId=${item.reservationId}`);
      if (res.ok) {
        const data = await res.json();
        setPositionOptions(data.positions || []);
        setSerialOptions(data.serials || []);
      }
    } catch (e) {
      toast.error('Erro ao carregar posições físicas.');
    }
  };

  const handlePositionChange = async (positionId: string) => {
    setSelectedPositionId(positionId);
    setSelectedSerialId('');

    if (activeReservation?.tracksSerial) {
      try {
        const res = await fetch(`/api/sales/orders/${orderId}/picking/options?reservationId=${activeReservation.reservationId}&positionId=${positionId}`);
        if (res.ok) {
          const data = await res.json();
          setSerialOptions(data.serials || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSaveAllocation = async () => {
    if (!activeReservation || !selectedPositionId) {
      toast.error('Selecione uma posição física.');
      return;
    }

    if (activeReservation.tracksSerial && !selectedSerialId) {
      toast.error('Selecione o número de série para itens serializados.');
      return;
    }

    const qty = activeReservation.tracksSerial ? 1 : Number(allocationQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Informe uma quantidade válida maior que zero.');
      return;
    }

    setSavingAllocation(true);
    try {
      const res = await fetch(`/api/sales/orders/${orderId}/picking/allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: activeReservation.reservationId,
          positionId: selectedPositionId,
          quantity: qty,
          serialId: activeReservation.tracksSerial ? selectedSerialId : undefined
        })
      });

      if (res.ok) {
        toast.success('Alocação física registrada com sucesso.');
        setActiveReservation(null);
        await fetchSummary();
        onPickingUpdated?.();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao registrar separação.');
      }
    } catch (e) {
      toast.error('Falha de conexão com o servidor.');
    } finally {
      setSavingAllocation(false);
    }
  };

  const handleCancelAllocation = async (allocationId: string) => {
    setCancellingId(allocationId);
    try {
      const res = await fetch(`/api/sales/orders/${orderId}/picking/allocations/${allocationId}/cancel`, {
        method: 'PUT'
      });
      if (res.ok) {
        toast.success('Alocação de separação liberada.');
        await fetchSummary();
        onPickingUpdated?.();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao liberar alocação.');
      }
    } catch (e) {
      toast.error('Erro de conexão ao liberar alocação.');
    } finally {
      setCancellingId(null);
    }
  };

  if (isLegacy) {
    return (
      <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border text-center space-y-2">
        <Package className="h-8 w-8 mx-auto text-zinc-400" />
        <p className="font-semibold text-zinc-700 dark:text-zinc-300">Pedido Legado</p>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          Este pedido foi confirmado no modelo antigo com baixa física imediata direta. O módulo de separação física por posição não é aplicável a pedidos legados.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-zinc-500">Carregando separação do pedido...</div>;
  }

  if (!summary || summary.items.length === 0) {
    return (
      <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border text-center space-y-2">
        <Package className="h-8 w-8 mx-auto text-zinc-400" />
        <p className="font-semibold text-zinc-700 dark:text-zinc-300">Sem reservas comerciais</p>
        <p className="text-sm text-zinc-500">
          {orderStatus === 'draft' 
            ? 'Confirme o pedido para gerar as reservas comerciais e habilitar a separação física.'
            : 'Nenhuma reserva ativa encontrada para este pedido.'}
        </p>
      </div>
    );
  }

  const isReadOnly = orderStatus !== 'confirmed';

  return (
    <div className="space-y-6">
      {/* Resumo de Progresso */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Separação Física / Picking
            </h3>
            <Badge 
              variant="outline"
              className={
                summary.allComplete
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : summary.totalPicked > 0
                  ? "bg-amber-50 text-amber-700 border-amber-300"
                  : "bg-zinc-100 text-zinc-600 border-zinc-200"
              }
            >
              {summary.allComplete
                ? 'Separação Completa'
                : summary.totalPicked > 0
                ? 'Separação em Andamento'
                : 'Não Iniciada'}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Total separado: <strong className="text-zinc-800 dark:text-zinc-200">{summary.totalPicked}</strong> de{' '}
            <strong className="text-zinc-800 dark:text-zinc-200">{summary.totalRequired}</strong> unidades reservadas.
          </p>
        </div>

        {orderStatus === 'confirmed' && (
          <div className="text-xs text-right">
            {summary.canShip ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Pronto para envio físico
              </span>
            ) : (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                <Clock className="h-4 w-4" /> Conclua a separação antes do envio
              </span>
            )}
          </div>
        )}
      </div>

      {/* Itens para Separar */}
      <div className="space-y-4">
        {summary.items.map((item) => (
          <div key={item.reservationId} className="border rounded-xl p-4 bg-white dark:bg-zinc-950 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">{item.itemDescription}</span>
                  <span className="text-xs font-mono text-zinc-400">({item.itemCode})</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {item.tracksBatch && (
                    <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                      <Layers className="h-3 w-3 mr-1" /> Requer Lote
                    </Badge>
                  )}
                  {item.tracksSerial && (
                    <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                      <Hash className="h-3 w-3 mr-1" /> Requer Serial
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <div>Reservado: <span className="font-bold">{item.requiredQuantity}</span></div>
                  <div>Separado: <span className="font-bold text-emerald-600">{item.pickedQuantity}</span></div>
                  <div>Pendente: <span className="font-bold text-amber-600">{item.remainingQuantity}</span></div>
                </div>

                {!isReadOnly && item.remainingQuantity > 0 && (
                  <Button 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    onClick={() => openAllocateModal(item)}
                  >
                    Separar Estoque
                  </Button>
                )}
              </div>
            </div>

            {/* Alocações já realizadas */}
            {item.allocations && item.allocations.length > 0 && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Posições Físicas Selecionadas:</p>
                <div className="grid gap-2">
                  {item.allocations.map((alloc) => (
                    <div 
                      key={alloc.id} 
                      className={`text-xs p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                        alloc.status === 'cancelled'
                          ? 'bg-zinc-100 dark:bg-zinc-900/30 text-zinc-400 line-through'
                          : 'bg-zinc-50 dark:bg-zinc-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {alloc.locationName}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          Qtd: {alloc.quantity}
                        </Badge>
                        {alloc.lotNumber && (
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                            Lote: {alloc.lotNumber}
                          </Badge>
                        )}
                        {alloc.serialNumber && (
                          <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 font-mono">
                            SN: {alloc.serialNumber}
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`text-[9px] uppercase ${
                            alloc.status === 'fulfilled'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : alloc.status === 'active'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {alloc.status === 'fulfilled' ? 'Enviado' : alloc.status === 'active' ? 'Separado' : 'Liberado'}
                        </Badge>
                      </div>

                      {!isReadOnly && alloc.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleCancelAllocation(alloc.id)}
                          disabled={cancellingId === alloc.id}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          {cancellingId === alloc.id ? 'Liberando...' : 'Liberar'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de Alocação de Posição / Serial */}
      {activeReservation && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Separar {activeReservation.itemDescription}
                </h4>
                <p className="text-xs text-zinc-500">
                  Pendente: <strong className="text-amber-600">{activeReservation.remainingQuantity}</strong> unidades
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveReservation(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Seleção de Posição Física */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400">
                  Posição Física de Origem
                </Label>
                {positionOptions.length === 0 ? (
                  <p className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    Nenhuma posição física disponível com estoque elegível para este produto.
                  </p>
                ) : (
                  <Select value={selectedPositionId} onValueChange={handlePositionChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a posição física..." />
                    </SelectTrigger>
                    <SelectContent>
                      {positionOptions.map((opt) => (
                        <SelectItem key={opt.positionId} value={opt.positionId}>
                          <div className="text-left text-xs py-0.5">
                            <span className="font-bold">{opt.locationName}</span>
                            <span className="text-zinc-400 ml-2">(Disp. Picking: {opt.availableForPicking})</span>
                            {opt.lotNumber && (
                              <span className="text-blue-600 ml-2 font-mono">[Lote: {opt.lotNumber}{opt.expiryDate ? ` - Venc: ${opt.expiryDate}` : ''}]</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Se o item exigir serial: selecionar número de série */}
              {activeReservation.tracksSerial && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400">
                    Número de Série (1 unidade)
                  </Label>
                  {serialOptions.length === 0 ? (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      Nenhum número de série elegível disponível nesta posição/lote.
                    </p>
                  ) : (
                    <Select value={selectedSerialId} onValueChange={setSelectedSerialId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o número de série..." />
                      </SelectTrigger>
                      <SelectContent>
                        {serialOptions.map((s) => (
                          <SelectItem key={s.serialId} value={s.serialId}>
                            <span className="font-mono font-bold text-xs">{s.serialNumber}</span>
                            {s.lotNumber && <span className="text-zinc-400 text-[11px] ml-2">(Lote: {s.lotNumber})</span>}
                            {s.locationName && <span className="text-zinc-400 text-[11px] ml-2">[{s.locationName}]</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Quantidade a separar (se não for serial) */}
              {!activeReservation.tracksSerial && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400">
                    Quantidade a retirar desta posição
                  </Label>
                  <Input 
                    type="number" 
                    min={1} 
                    max={activeReservation.remainingQuantity}
                    value={allocationQuantity}
                    onChange={(e) => setAllocationQuantity(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setActiveReservation(null)}>
                Cancelar
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                onClick={handleSaveAllocation}
                disabled={savingAllocation || !selectedPositionId || positionOptions.length === 0 || (activeReservation.tracksSerial && !selectedSerialId)}
              >
                {savingAllocation ? 'Salvando...' : 'Confirmar Separação'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
