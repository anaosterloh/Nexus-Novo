import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  ClipboardCheck, 
  Edit2, 
  Trash2, 
  Copy,
  CheckSquare,
  ListTodo,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Settings,
  Printer
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  text: string;
  type: 'boolean' | 'number' | 'text' | 'selection';
  required: boolean;
  hasObservation: boolean;
  hasNumber: boolean;
  observationLabel?: string;
  numberLabel?: string;
  unit?: string;
  options?: string[];
}

interface ChecklistTemplate {
  id: string;
  name: string;
  category: string;
  items: ChecklistItem[];
  status: 'active' | 'draft';
  lastUpdated: string;
}

export function ChecklistManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newItems, setNewItems] = useState<Partial<ChecklistItem>[]>([
    { id: '1', text: '', type: 'boolean', required: true, hasObservation: false, hasNumber: false }
  ]);

  const templates: ChecklistTemplate[] = [
    { 
      id: '1', 
      name: 'Manutenção Preventiva - Raio-X', 
      category: 'Técnica', 
      items: [
        { id: 'i1', text: 'Verificar cabos de alta tensão', type: 'boolean' },
        { id: 'i2', text: 'Medir voltagem de saída', type: 'number' },
        { id: 'i3', text: 'Estado geral da carcaça', type: 'text' }
      ], 
      status: 'active', 
      lastUpdated: '12/03/2024' 
    },
    { 
      id: '2', 
      name: 'Inspeção de Segurança Predial', 
      category: 'Segurança', 
      items: Array(15).fill({ text: 'Item de segurança', type: 'boolean' }), 
      status: 'active', 
      lastUpdated: '10/03/2024' 
    },
  ];

  const addItem = () => {
    setNewItems([...newItems, { id: Math.random().toString(), text: '', type: 'boolean' }]);
  };

  const removeItem = (id: string) => {
    setNewItems(newItems.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ChecklistItem, value: any) => {
    setNewItems(newItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handlePrint = (template: ChecklistTemplate) => {
    toast.info(`Gerando versão para impressão do checklist: ${template.name}`);
    // In a real app, this would open a new window with a print-friendly layout
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Checklist: ${template.name}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; }
              .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
              .info-item { border-bottom: 1px solid #ccc; padding: 5px 0; }
              .label { font-weight: bold; font-size: 12px; text-transform: uppercase; color: #666; }
              .item { border: 1px solid #eee; padding: 15px; margin-bottom: 10px; display: flex; align-items: center; }
              .checkbox { width: 20px; height: 20px; border: 2px solid #000; margin-right: 15px; }
              .footer { margin-top: 50px; border-top: 1px solid #000; padding-top: 20px; display: flex; justify-content: space-between; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${template.name}</h1>
              <p>Categoria: ${template.category} | Data: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="info-grid">
              <div class="info-item"><div class="label">Cliente / Empresa</div>&nbsp;</div>
              <div class="info-item"><div class="label">Equipamento / Patrimônio</div>&nbsp;</div>
              <div class="info-item"><div class="label">Ordem de Serviço / Pedido</div>&nbsp;</div>
              <div class="info-item"><div class="label">Técnico Responsável</div>&nbsp;</div>
            </div>
            <div class="items">
              ${template.items.map((item, i) => `
                <div class="item">
                  <div class="checkbox"></div>
                  <div>
                    <div style="font-weight: bold;">${i + 1}. ${item.text}</div>
                    ${item.hasObservation ? '<div style="margin-top: 5px; color: #999; font-size: 10px;">Obs: ____________________________________________________</div>' : ''}
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="footer">
              <div>Assinatura do Técnico: ___________________________</div>
              <div>Assinatura do Cliente: ___________________________</div>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciador de Checklists</h2>
          <p className="text-zinc-500">Crie e gerencie modelos de verificação para serviços e auditorias.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4" /> Novo Checklist
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-600">Modelos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">12</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-600">Itens Verificados (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">1.450</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-600">Taxa de Conformidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">94.2%</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input 
            placeholder="Buscar modelos de checklist..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" /> Categorias
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="group hover:border-blue-500 transition-all shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                  {template.category}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2" onClick={() => handlePrint(template)}>
                      <Printer className="h-4 w-4" /> Imprimir
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2"><Edit2 className="h-4 w-4" /> Editar</DropdownMenuItem>
                    <DropdownMenuItem className="gap-2"><Copy className="h-4 w-4" /> Duplicar</DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-rose-600"><Trash2 className="h-4 w-4" /> Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardTitle className="text-lg mt-2">{template.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 text-xs">
                <ListTodo className="h-3 w-3" /> {template.items?.length || 0} itens de verificação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Última Atualização</span>
                  <span className="text-xs font-medium">{template.lastUpdated}</span>
                </div>
                <Badge className={cn(
                  "text-[10px] font-bold",
                  template.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-400'
                )}>
                  {template.status === 'active' ? 'ATIVO' : 'RASCUNHO'}
                </Badge>
              </div>
              <Button variant="outline" className="w-full mt-4 text-xs h-8 gap-2">
                <ClipboardCheck className="h-3 w-3" /> Visualizar Itens
              </Button>
            </CardContent>
          </Card>
        ))}
        
        <Card 
          className="border-dashed flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="text-sm font-bold text-zinc-500">Criar Novo Modelo</p>
          <p className="text-xs text-zinc-400 mt-1">Defina itens e categorias</p>
        </Card>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Novo Modelo de Checklist</DialogTitle>
            <DialogDescription>Configure a estrutura básica do seu checklist.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Checklist</Label>
              <Input id="name" placeholder="Ex: Manutenção Preventiva - Equipamento X" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Input id="category" placeholder="Ex: Técnica, Qualidade..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo de Resposta</Label>
                <Input id="type" placeholder="Conforme/Não Conforme" disabled />
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold">Itens do Checklist</Label>
                <Button variant="outline" size="sm" onClick={addItem} className="h-7 text-[10px] gap-1">
                  <Plus className="h-3 w-3" /> Adicionar Item
                </Button>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {newItems.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-lg space-y-4 bg-zinc-50/50 dark:bg-zinc-900/50 relative group/item">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 mt-1">
                        <span className="text-[10px] font-bold text-zinc-400">{index + 1}</span>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Descrição do item de verificação..." 
                            className="flex-1 h-9 text-sm font-medium" 
                            value={item.text}
                            onChange={(e) => updateItem(item.id!, 'text', e.target.value)}
                          />
                          <select 
                            className="h-9 text-xs border rounded-md px-2 bg-white dark:bg-zinc-950 font-medium"
                            value={item.type}
                            onChange={(e) => updateItem(item.id!, 'type', e.target.value)}
                          >
                            <option value="boolean">Sim/Não</option>
                            <option value="number">Valor Numérico</option>
                            <option value="text">Texto Livre</option>
                            <option value="selection">Múltipla Escolha</option>
                          </select>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => removeItem(item.id!)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                              checked={item.hasObservation}
                              onChange={(e) => updateItem(item.id!, 'hasObservation', e.target.checked)}
                            />
                            <span className="text-[11px] font-medium text-zinc-600">Incluir Observação</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                              checked={item.hasNumber}
                              onChange={(e) => updateItem(item.id!, 'hasNumber', e.target.checked)}
                            />
                            <span className="text-[11px] font-medium text-zinc-600">Incluir Campo Numérico</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                              checked={item.required}
                              onChange={(e) => updateItem(item.id!, 'required', e.target.checked)}
                            />
                            <span className="text-[11px] font-medium text-zinc-600">Obrigatório</span>
                          </label>
                        </div>

                        {(item.hasObservation || item.hasNumber) && (
                          <div className="grid grid-cols-2 gap-3 p-3 bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800">
                            {item.hasObservation && (
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-zinc-400">Label da Observação</Label>
                                <Input 
                                  placeholder="Ex: Detalhes do defeito" 
                                  className="h-8 text-xs"
                                  value={item.observationLabel}
                                  onChange={(e) => updateItem(item.id!, 'observationLabel', e.target.value)}
                                />
                              </div>
                            )}
                            {item.hasNumber && (
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-zinc-400">Label do Número / Unidade</Label>
                                <div className="flex gap-2">
                                  <Input 
                                    placeholder="Ex: Voltagem" 
                                    className="h-8 text-xs flex-1"
                                    value={item.numberLabel}
                                    onChange={(e) => updateItem(item.id!, 'numberLabel', e.target.value)}
                                  />
                                  <Input 
                                    placeholder="Un." 
                                    className="h-8 text-xs w-12"
                                    value={item.unit}
                                    onChange={(e) => updateItem(item.id!, 'unit', e.target.value)}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700">Criar Modelo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
