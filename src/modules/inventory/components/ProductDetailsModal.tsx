import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  BarChart2, 
  History, 
  Layers, 
  Tag, 
  MapPin, 
  DollarSign, 
  AlertTriangle,
  FileText,
  Printer
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductLotsModal } from './ProductLotsModal';

interface ProductDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

export function ProductDetailsModal({ open, onOpenChange, product }: ProductDetailsModalProps) {
  const [lotsModalOpen, setLotsModalOpen] = useState(false);

  if (!product) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border-b px-6 py-4 flex justify-between items-start">
            <div className="flex gap-4">
              <div className="h-16 w-16 bg-white dark:bg-zinc-800 rounded-lg border flex items-center justify-center shadow-sm">
                <Package className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs bg-zinc-100 text-zinc-600 border-zinc-200">
                    {product.code}
                  </Badge>
                  <Badge className={product.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-zinc-500'}>
                    {product.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                  
                  {/* Classificação Operacional */}
                  {product.item_type === 'part' && (
                    <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
                      Peça / Componente
                    </Badge>
                  )}
                  {(product.item_type === 'consumable' || product.item_type === 'raw_material') && (
                    <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-300">
                      Consumo / Insumo
                    </Badge>
                  )}
                  {product.item_type === 'sale' && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Venda / Revenda
                    </Badge>
                  )}

                  {/* Controles de Rastreabilidade e Composição */}
                  {Boolean(product.is_composite || product.item_type === 'kit') && (
                    <Badge className="bg-purple-600 text-white hover:bg-purple-700">
                      Kit / BOM
                    </Badge>
                  )}
                  {Boolean(product.tracks_batch || product.item_type === 'batch') && (
                    <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                      Lote
                    </Badge>
                  )}
                  {Boolean(product.tracks_serial || product.item_type === 'serial') && (
                    <Badge className="bg-amber-600 text-white hover:bg-amber-700">
                      Serial
                    </Badge>
                  )}
                  {Boolean(product.tracks_expiry) && (
                    <Badge className="bg-orange-600 text-white hover:bg-orange-700">
                      Validade
                    </Badge>
                  )}
                  {Boolean(product.tracks_manufacturing_date) && (
                    <Badge className="bg-teal-600 text-white hover:bg-teal-700">
                      Fabricação
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {product.description}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1 flex-wrap">
                  <Tag className="h-3 w-3" /> {product.category}
                  <span className="text-zinc-300">•</span>
                  <MapPin className="h-3 w-3" /> {product.physical_location || product.location || 'Sem localização definida'}
                </DialogDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Printer className="h-4 w-4" /> Imprimir Ficha
              </Button>
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setLotsModalOpen(true)}>
                <Layers className="h-4 w-4" /> Gerenciar Lotes
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="overview" className="w-full">
              <div className="px-6 border-b bg-white dark:bg-zinc-950 sticky top-0 z-10">
                <TabsList className="h-12 w-full justify-start bg-transparent p-0 gap-6">
                  <TabsTrigger 
                    value="overview" 
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-none px-0 h-12"
                  >
                    Visão Geral
                  </TabsTrigger>
                  <TabsTrigger 
                    value="movements" 
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-none px-0 h-12"
                  >
                    Movimentações Recentes
                  </TabsTrigger>
                  <TabsTrigger 
                    value="suppliers" 
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-none px-0 h-12"
                  >
                    Fornecedores
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6 space-y-6">
                <TabsContent value="overview" className="m-0 space-y-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg border bg-zinc-50 dark:bg-zinc-900/50">
                          <span className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                            <Package className="h-3 w-3" /> Estoque Atual
                          </span>
                          <p className="text-2xl font-bold mt-2">{product.total_quantity} <span className="text-sm font-normal text-zinc-500">{product.unit}</span></p>
                        </div>
                        <div className="p-4 rounded-lg border bg-zinc-50 dark:bg-zinc-900/50">
                          <span className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                            <DollarSign className="h-3 w-3" /> Custo Médio
                          </span>
                          <p className="text-2xl font-bold mt-2">R$ {product.costPrice?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div className="p-4 rounded-lg border bg-zinc-50 dark:bg-zinc-900/50">
                          <span className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                            <DollarSign className="h-3 w-3" /> Preço Venda
                          </span>
                          <p className="text-2xl font-bold mt-2 text-emerald-600">R$ {product.sellingPrice?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-bold text-sm uppercase text-zinc-500 flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Especificações Técnicas
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm border rounded-lg p-4">
                          <div className="space-y-1">
                            <span className="text-zinc-500 text-xs uppercase font-bold">Categoria</span>
                            <p>{product.category}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-zinc-500 text-xs uppercase font-bold">Unidade de Medida</span>
                            <p>{product.unit === 'UN' ? 'Unidade (UN)' : product.unit}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-zinc-500 text-xs uppercase font-bold">NCM</span>
                            <p>{product.ncm || '-'}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-zinc-500 text-xs uppercase font-bold">CEST</span>
                            <p>{product.cest || '-'}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-zinc-500 text-xs uppercase font-bold">Estoque Mínimo</span>
                            <p>{product.minStock || 0}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-zinc-500 text-xs uppercase font-bold">Estoque Máximo</span>
                            <p>{product.maxStock || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20">
                        <h3 className="font-bold text-sm text-amber-800 dark:text-amber-500 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" /> Status do Estoque
                        </h3>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-600">Disponível</span>
                            <span className="font-bold">{product.total_quantity}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-600">Reservado</span>
                            <span className="font-bold">0</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-600">Em Trânsito</span>
                            <span className="font-bold">0</span>
                          </div>
                          <Separator className="bg-amber-200/50" />
                          <div className="flex justify-between text-sm font-bold text-amber-900">
                            <span>Total Físico</span>
                            <span>{product.total_quantity}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h3 className="font-bold text-sm text-zinc-500 mb-3">Lotes Próximos do Vencimento</h3>
                        <div className="py-4 text-center">
                          <p className="text-xs text-zinc-400">Nenhum alerta de validade disponível.</p>
                        </div>
                        <Button variant="link" className="w-full text-xs mt-1 h-auto p-0 text-emerald-600" onClick={() => setLotsModalOpen(true)}>
                          Ver todos os lotes
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="movements" className="m-0">
                  <div className="flex items-center justify-center p-12 text-zinc-400 border-2 border-dashed rounded-lg bg-zinc-50">
                    <div className="text-center">
                      <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p>Histórico de movimentações gerais do produto.</p>
                      <p className="text-xs mt-1">Para ver detalhes por lote, acesse "Gerenciar Lotes".</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="suppliers" className="m-0">
                  <div className="flex items-center justify-center p-12 text-zinc-400 border-2 border-dashed rounded-lg bg-zinc-50">
                    <div className="text-center">
                      <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p>Lista de fornecedores homologados.</p>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <DialogFooter className="border-t p-4 bg-zinc-50 dark:bg-zinc-900/50">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {lotsModalOpen && (
        <ProductLotsModal 
          open={lotsModalOpen} 
          onOpenChange={setLotsModalOpen} 
          product={product} 
        />
      )}
    </>
  );
}
