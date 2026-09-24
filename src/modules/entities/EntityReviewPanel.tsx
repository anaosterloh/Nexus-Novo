import React, { useState, useEffect } from 'react';
import { Entity, ReviewEntityPayload, BlockEntityPayload } from './types';
import { entityService } from './entityService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, CheckCircle, XCircle, AlertTriangle, ShieldAlert, FileText, Ban
} from 'lucide-react';
import { EntityDetails } from './EntityDetails';
import { PinConfirmDialog } from '@/components/security/PinConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export const EntityReviewPanel: React.FC = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Modal actions
  const [actionEntity, setActionEntity] = useState<Entity | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'correction' | 'block' | 'unblock' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Pin Confirm dialog
  const [pinDialogOpen, setPinDialogOpen] = useState(false);

  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    setLoading(true);
    try {
      const data = await entityService.getPendingReviewEntities();
      setEntities(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const total = entities.length;
  const temporary = entities.filter(e => e.status === 'temporary').length;
  const docPending = entities.filter(e => e.documentation_status === 'pending').length;
  const duplicateSuspect = entities.filter(e => e.duplicate_suspect === 1).length;

  const roleNameMap: Record<string, string> = {
    customer: 'Cliente',
    supplier: 'Fornecedor',
    carrier: 'Transportadora',
    manufacturer: 'Fabricante',
    partner: 'Parceiro',
    prospect: 'Prospect'
  };

  const executeAction = async () => {
    if (!actionEntity || !actionType) return;
    setActionLoading(true);

    try {
      if (actionType === 'approve') {
        const payload: ReviewEntityPayload = { review_status: 'approved' };
        await entityService.reviewEntity(actionEntity.id, payload);
      } else if (actionType === 'reject') {
        const payload: ReviewEntityPayload = { review_status: 'rejected', internal_notes: actionReason };
        await entityService.reviewEntity(actionEntity.id, payload);
      } else if (actionType === 'correction') {
        const payload: ReviewEntityPayload = { review_status: 'needs_correction', document_notes: actionReason };
        await entityService.reviewEntity(actionEntity.id, payload);
      } else if (actionType === 'block') {
        const payload: BlockEntityPayload = { blocked: true, reason: actionReason };
        await entityService.blockEntity(actionEntity.id, payload);
      } else if (actionType === 'unblock') {
        const payload: BlockEntityPayload = { blocked: false, reason: actionReason };
        await entityService.blockEntity(actionEntity.id, payload);
      }
      
      setActionEntity(null);
      setActionType(null);
      setActionReason('');
      loadEntities();
    } catch (err: any) {
      if (err.isPinRequired) {
        setPinDialogOpen(true);
      } else {
        console.error(err);
        alert('Erro ao executar ação: ' + err.message);
      }
    } finally {
      setActionLoading(false);
    }
  };
  
  const prepareActionExecution = () => {
    executeAction();
  };

  const openAction = (entity: Entity, type: typeof actionType) => {
    setActionEntity(entity);
    setActionType(type);
    setActionReason('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Revisão de Cadastros</h1>
        <p className="text-sm text-zinc-500 mt-1">Aprove, bloqueie e gerencie cadastros pendentes e temporários.</p>
        <p className="text-xs text-amber-600 mt-2 font-medium">Controle de permissões completo será aplicado em fase futura.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temporários (Pré-cadastro)</CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{temporary}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doc. Pendente</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{docPending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspeita Duplicidade</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{duplicateSuspect}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table - Desktop */}
      <div className="hidden lg:block bg-white dark:bg-zinc-900 border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Documento</th>
                <th className="px-4 py-3 font-medium">Papéis</th>
                <th className="px-4 py-3 font-medium">Revisão</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y relative">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    Carregando pendências...
                  </td>
                </tr>
              ) : entities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-emerald-600 font-medium bg-emerald-50/50">
                    Não há cadastros pendentes de revisão. Ótimo trabalho!
                  </td>
                </tr>
              ) : (
                entities.map(entity => (
                  <tr key={entity.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{entity.trade_name || entity.display_name}</div>
                      {entity.quick_register === 1 && (
                        <div className="text-[10px] uppercase font-semibold text-amber-600 mt-1">Via Pré-cadastro</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {entity.document || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {entity.is_customer === 1 && <Badge variant="secondary" className="text-xs">Cliente</Badge>}
                        {entity.is_supplier === 1 && <Badge variant="secondary" className="text-xs">Fornecedor</Badge>}
                        {entity.is_carrier === 1 && <Badge variant="secondary" className="text-xs">Transportadora</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant={entity.status === 'temporary' ? 'secondary' : 'outline'}>
                          {entity.status}
                        </Badge>
                        <span className="text-[10px] text-zinc-500 uppercase">{entity.review_status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(entity.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedEntityId(entity.id)}>
                          Detalhes
                        </Button>
                        <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => openAction(entity, 'approve')}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                        </Button>
                        <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => openAction(entity, 'correction')}>
                          <AlertTriangle className="w-4 h-4 mr-1" /> Correção
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => openAction(entity, 'block')}>
                          <Ban className="w-4 h-4 mr-1" /> Bloquear
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards - Mobile / Tablet */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <div className="text-center py-10 bg-white dark:bg-zinc-900 border rounded-lg text-zinc-500">
            Carregando pendências...
          </div>
        ) : entities.length === 0 ? (
          <div className="text-center py-10 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-lg text-emerald-600 font-medium">
            Não há cadastros pendentes de revisão.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {entities.map(entity => (
              <Card key={entity.id} className="overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {entity.trade_name || entity.display_name}
                        </h3>
                        {entity.quick_register === 1 && (
                          <Badge variant="outline" className="text-[9px] uppercase h-4 px-1 border-amber-200 text-amber-600">Pré</Badge>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">{new Date(entity.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <Badge variant={entity.status === 'temporary' ? 'secondary' : 'outline'} className="shrink-0 text-[10px] h-5">
                      {entity.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase w-12">DOC:</span>
                      <span className="font-mono text-xs">{entity.document || '-'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {entity.is_customer === 1 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Cliente</Badge>}
                      {entity.is_supplier === 1 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Fornecedor</Badge>}
                      {entity.is_carrier === 1 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Transportadora</Badge>}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase w-12">REVIEW:</span>
                      <span className="text-[10px] uppercase font-semibold text-zinc-500">{entity.review_status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <Button variant="outline" size="sm" className="h-8 text-xs font-medium" onClick={() => setSelectedEntityId(entity.id)}>
                      Detalhes
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-medium text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => openAction(entity, 'approve')}>
                      <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Aprovar
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-medium text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => openAction(entity, 'correction')}>
                      <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Corrigir
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-medium text-red-600 border-red-200 hover:bg-red-50" onClick={() => openAction(entity, 'block')}>
                      <Ban className="mr-1.5 h-3.5 w-3.5" /> Bloquear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {actionEntity && actionType && (
        <Dialog open onOpenChange={() => setActionEntity(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' && 'Aprovar Cadastro'}
                {actionType === 'reject' && 'Reprovar Cadastro'}
                {actionType === 'correction' && 'Solicitar Correção'}
                {actionType === 'block' && 'Bloquear Entidade'}
                {actionType === 'unblock' && 'Desbloquear Entidade'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'approve' && `Tem certeza que deseja aprovar o cadastro de ${actionEntity.display_name}? O status passará a ser Ativo.`}
                {actionType === 'reject' && `Tem certeza que deseja reprovar o cadastro de ${actionEntity.display_name}?`}
                {actionType === 'correction' && `Informe o que precisa ser corrigido no cadastro de ${actionEntity.display_name}.`}
                {actionType === 'block' && `Tem certeza que deseja BLOQUEAR as operações para ${actionEntity.display_name}?`}
                {actionType === 'unblock' && `Tem certeza que deseja DESBLOQUEAR as operações para ${actionEntity.display_name}?`}
              </DialogDescription>
            </DialogHeader>
            
            {(actionType === 'correction' || actionType === 'block' || actionType === 'unblock' || actionType === 'reject') && (
              <div className="py-4 space-y-2">
                <label className="text-sm font-medium">
                  {actionType === 'correction' ? 'Motivo / Instruções de Correção' : 'Motivo / Observação'}
                </label>
                <Input 
                  value={actionReason} 
                  onChange={e => setActionReason(e.target.value)} 
                  placeholder="Descreva brevemente..." 
                  autoFocus
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setActionEntity(null)}>Cancelar</Button>
              <Button disabled={actionLoading} variant={actionType === 'block' || actionType === 'reject' ? 'destructive' : 'default'} onClick={prepareActionExecution}>
                {actionLoading ? 'Processando...' : 'Confirmar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <PinConfirmDialog
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        actionKey={actionType === 'approve' ? 'approve_entity' : actionType === 'reject' ? 'reject_entity' : actionType === 'correction' ? 'request_entity_correction' : actionType === 'block' ? 'block_entity' : 'unblock_entity'}
        actionGroup="entities"
        onConfirm={executeAction}
        title={actionType === 'approve' ? 'Aprovar Entidade' : 'Bloquear/Reprovar'}
      />

      {selectedEntityId && (
        <EntityDetails 
          entityId={selectedEntityId} 
          onClose={() => setSelectedEntityId(null)} 
        />
      )}
    </div>
  );
};
