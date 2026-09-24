import React, { useState, useEffect } from 'react';
import { Entity } from './types';
import { entityService } from './entityService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Building2, Wrench, FileText, ShoppingCart, DollarSign, History } from 'lucide-react';

type EntityDetailsProps = {
  entityId: string;
  onClose: () => void;
};

export const EntityDetails: React.FC<EntityDetailsProps> = ({ entityId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEntity();
  }, [entityId]);

  const loadEntity = async () => {
    setLoading(true);
    try {
      const data = await entityService.getEntity(entityId);
      setEntity(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes.');
    } finally {
      setLoading(false);
    }
  };

  if (!entityId) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes: {entity?.display_name || 'Carregando...'}</DialogTitle>
          <DialogDescription className="sr-only">
            Ver e gerenciar detalhes completos da entidade em abas de categorias.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-red-500 font-medium my-4">{error}</div>
        )}

        {loading && !entity && (
          <div className="text-zinc-500 my-4">Carregando dados da entidade...</div>
        )}

        {entity && (
          <Tabs defaultValue="geral" className="w-full mt-4">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 h-auto">
              <TabsTrigger value="geral" className="text-xs">Dados Gerais</TabsTrigger>
              <TabsTrigger value="revisao" className="text-xs">Revisão</TabsTrigger>
              <TabsTrigger value="papeis" className="text-xs">Papéis</TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs">Documentação</TabsTrigger>
              <TabsTrigger value="equipamentos" className="text-xs">Equipamentos</TabsTrigger>
              <TabsTrigger value="pedidos" className="text-xs">Pedidos</TabsTrigger>
              <TabsTrigger value="financeiro" className="text-xs">Financeiro</TabsTrigger>
              <TabsTrigger value="historico" className="text-xs">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-zinc-500">Nome de Exibição</span>
                  <p className="font-medium text-lg text-zinc-900 dark:text-zinc-50">{entity.display_name}</p>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500">Documento</span>
                  <p className="text-zinc-700 dark:text-zinc-300">{entity.document || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500">Nome Fantasia</span>
                  <p className="text-zinc-700 dark:text-zinc-300">{entity.trade_name || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500">Razão Social</span>
                  <p className="text-zinc-700 dark:text-zinc-300">{entity.legal_name || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500">E-mail</span>
                  <p className="text-zinc-700 dark:text-zinc-300">{entity.email || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500">Telefone</span>
                  <p className="text-zinc-700 dark:text-zinc-300">{entity.phone || '-'}</p>
                </div>
                <div className="col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg mt-2">
                  <div>
                    <span className="font-semibold text-xs text-zinc-500 uppercase">Status Geral</span>
                    <p className="mt-1"><Badge variant={entity.status === 'active' ? 'default' : 'secondary'}>{entity.status}</Badge></p>
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-zinc-500 uppercase">Status Revisão</span>
                    <p className="mt-1 text-zinc-700 dark:text-zinc-300">{entity.review_status}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-zinc-500 uppercase">Status Operacional</span>
                    <p className="mt-1 text-zinc-700 dark:text-zinc-300">{entity.operational_status}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-zinc-500 uppercase">Status Financeiro</span>
                    <p className="mt-1 text-zinc-700 dark:text-zinc-300">{entity.financial_status}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-zinc-500">Observações Internas</span>
                  <p className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 p-3 rounded min-h-[60px]">
                    {entity.internal_notes || 'Nenhuma observação interna.'}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-zinc-500">Criado em</span>
                  <p className="text-zinc-700 dark:text-zinc-300">{new Date(entity.created_at).toLocaleString('pt-BR')}</p>
                  {entity.updated_at && <p className="text-xs text-zinc-500 mt-1">Última atualização: {new Date(entity.updated_at).toLocaleString('pt-BR')}</p>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="revisao" className="space-y-4 py-4">
              <h3 className="font-medium text-lg mb-4">Revisão e Controle</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
                <div className="col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
                  <div>
                    <span className="font-semibold text-xs text-zinc-500 uppercase">Status Geral</span>
                    <p className="mt-1"><Badge variant={entity.status === 'active' ? 'default' : 'secondary'}>{entity.status}</Badge></p>
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-zinc-500 uppercase">Status Revisão</span>
                    <p className="mt-1 text-zinc-700 dark:text-zinc-300 font-medium">{entity.review_status}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-zinc-500 uppercase">Status Documentação</span>
                    <p className="mt-1 text-zinc-700 dark:text-zinc-300">{entity.documentation_status}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-zinc-500 uppercase">Suspeita Duplicidade</span>
                    <p className="mt-1 text-zinc-700 dark:text-zinc-300">{entity.duplicate_suspect === 1 ? 'Sim' : 'Não'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-zinc-500 uppercase">Pré-cadastro Rápido</span>
                    <p className="mt-1 text-zinc-700 dark:text-zinc-300">{entity.quick_register === 1 ? 'Sim' : 'Não'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-zinc-500 uppercase">Status Operacional</span>
                    <p className="mt-1 text-zinc-700 dark:text-zinc-300">{entity.operational_status}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-zinc-500 uppercase">Status Financeiro</span>
                    <p className="mt-1 text-zinc-700 dark:text-zinc-300">{entity.financial_status}</p>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border">
                  <span className="font-semibold text-zinc-500 text-xs uppercase mb-2 block">Por</span>
                  <p className="text-zinc-700 dark:text-zinc-300 font-medium">{entity.reviewed_by || 'Não revisado'}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border">
                  <span className="font-semibold text-zinc-500 text-xs uppercase mb-2 block">Em</span>
                  <p className="text-zinc-700 dark:text-zinc-300">{entity.reviewed_at ? new Date(entity.reviewed_at).toLocaleString('pt-BR') : 'N/A'}</p>
                </div>

                <div className="col-span-2">
                  <span className="font-semibold text-zinc-500 uppercase text-xs mb-2 block">Observações do Histórico & Internas</span>
                  <p className="text-zinc-700 dark:text-zinc-300 bg-amber-50/50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30 p-3 rounded min-h-[60px] whitespace-pre-wrap">
                    {entity.internal_notes || 'Nenhuma observação interna.'}
                  </p>
                </div>

                <div className="col-span-2">
                  <span className="font-semibold text-zinc-500 uppercase text-xs mb-2 block">Notas de Documentação</span>
                  <p className="text-zinc-700 dark:text-zinc-300 bg-purple-50/50 border border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/30 p-3 rounded min-h-[60px] whitespace-pre-wrap">
                    {entity.document_notes || 'Nenhuma nota de documentação informada.'}
                  </p>
                </div>

              </div>
              <div className="mt-8 text-sm text-zinc-500">
                <AlertCircle className="inline-block w-4 h-4 mr-1 mb-1" />
                Ações de aprovação e bloqueio estão disponíveis no painel "Revisão de Cadastros" com controle de permissões.
              </div>
            </TabsContent>

            <TabsContent value="papeis" className="py-4">
              <h3 className="font-medium text-lg mb-4">Papéis Ativos</h3>
              <div className="flex flex-wrap gap-2">
                {entity.is_customer === 1 && <Badge className="text-sm py-1 px-3" variant="outline">Cliente</Badge>}
                {entity.is_supplier === 1 && <Badge className="text-sm py-1 px-3" variant="outline">Fornecedor</Badge>}
                {entity.is_carrier === 1 && <Badge className="text-sm py-1 px-3" variant="outline">Transportadora</Badge>}
                {entity.is_manufacturer === 1 && <Badge className="text-sm py-1 px-3" variant="outline">Fabricante</Badge>}
                {entity.is_partner === 1 && <Badge className="text-sm py-1 px-3" variant="outline">Parceiro</Badge>}
                {entity.is_prospect === 1 && <Badge className="text-sm py-1 px-3" variant="outline">Prospect</Badge>}
              </div>
              <div className="mt-8 text-sm text-zinc-500">
                <AlertCircle className="inline-block w-4 h-4 mr-1 mb-1" />
                Para adicionar ou remover papéis, use a opção 'Editar Cadastro'.
              </div>
            </TabsContent>

            <TabsContent value="documentos" className="py-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4 bg-zinc-50 dark:bg-zinc-800/30 p-8 rounded-lg border border-dashed">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                  <FileText className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium">Anexos — Em construção</h3>
                <p className="text-sm text-zinc-500 max-w-sm">
                  Nesta fase, registre nas observações onde o documento foi recebido. Upload real de arquivos ficará para a fase de Documentação de Clientes.
                </p>
                {entity.document_notes && (
                  <div className="mt-4 p-4 bg-white dark:bg-zinc-900 text-left border rounded w-full max-w-md">
                    <span className="font-semibold text-xs uppercase text-zinc-500">Notas de Documentação:</span>
                    <p className="mt-1 text-sm">{entity.document_notes}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="equipamentos" className="py-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4 bg-zinc-50 dark:bg-zinc-800/30 p-8 rounded-lg border border-dashed">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                  <Wrench className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium">Equipamentos vinculados — Em construção</h3>
                <p className="text-sm text-zinc-500 max-w-sm">
                  Esta aba exibirá todos os equipamentos onde esta entidade figura como cliente ou parceiro técnico. Em breve.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="pedidos" className="py-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4 bg-zinc-50 dark:bg-zinc-800/30 p-8 rounded-lg border border-dashed">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                  <ShoppingCart className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium">Pedidos / Orçamentos — Em construção</h3>
                <p className="text-sm text-zinc-500 max-w-sm">
                  Integração nativa com o módulo Comercial e Gestão de Vendas. Em breve.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="financeiro" className="py-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4 bg-zinc-50 dark:bg-zinc-800/30 p-8 rounded-lg border border-dashed">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                  <DollarSign className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium">Financeiro — Em construção</h3>
                <p className="text-sm text-zinc-500 max-w-sm">
                  Visão completa de Contas a Receber, Contas a Pagar e Limite de Crédito desta entidade. Em breve.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="historico" className="py-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4 bg-zinc-50 dark:bg-zinc-800/30 p-8 rounded-lg border border-dashed">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                  <History className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium">Histórico — Em construção</h3>
                <p className="text-sm text-zinc-500 max-w-sm">
                  Aprovação por permissão e trilha de auditoria completa da entidade. Em breve.
                </p>
              </div>
            </TabsContent>

          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
