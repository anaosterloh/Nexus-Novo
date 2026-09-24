import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Table as TableIcon,
  Building2,
  Users,
  CreditCard,
  MapPin,
  Tag
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function TabelaList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewRecordOpen, setIsNewRecordOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('departamentos');

  const categories = [
    { id: 'departamentos', label: 'Departamentos', icon: Building2, count: 8 },
    { id: 'centros_custo', label: 'Centros de Custo', icon: CreditCard, count: 12 },
    { id: 'unidades', label: 'Unidades de Medida', icon: Tag, count: 15 },
    { id: 'cidades', label: 'Cidades e Estados', icon: MapPin, count: 240 },
    { id: 'grupos_produtos', label: 'Grupos de Produtos', icon: Tag, count: 22 },
    { id: 'naturezas', label: 'Naturezas de Operação', icon: TableIcon, count: 10 },
  ];

  const mockData: Record<string, any[]> = {
    departamentos: [
      { id: 1, nome: 'Administrativo', sigla: 'ADM', status: 'Ativo' },
      { id: 2, nome: 'Comercial', sigla: 'COM', status: 'Ativo' },
      { id: 3, nome: 'Financeiro', sigla: 'FIN', status: 'Ativo' },
      { id: 4, nome: 'Logística', sigla: 'LOG', status: 'Ativo' },
      { id: 5, nome: 'Técnico', sigla: 'TEC', status: 'Ativo' },
    ],
    centros_custo: [
      { id: 1, nome: 'Sede Principal', codigo: '01.001', status: 'Ativo' },
      { id: 2, nome: 'Filial Sul', codigo: '02.001', status: 'Ativo' },
      { id: 3, nome: 'Marketing', codigo: '03.001', status: 'Ativo' },
    ],
    unidades: [
      { id: 1, nome: 'Unidade', sigla: 'UN', status: 'Ativo' },
      { id: 2, nome: 'Kilograma', sigla: 'KG', status: 'Ativo' },
      { id: 3, nome: 'Metro', sigla: 'MT', status: 'Ativo' },
      { id: 4, nome: 'Caixa', sigla: 'CX', status: 'Ativo' },
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tabelas e Listas</h2>
          <p className="text-zinc-500">Gerencie cadastros auxiliares utilizados em todo o sistema.</p>
        </div>
      </div>

      <Tabs defaultValue="departamentos" onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2">
          <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-0.5 h-auto flex-wrap justify-start">
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="gap-1.5 py-1.5 px-3 text-xs">
                <cat.icon className="h-3.5 w-3.5" />
                {cat.label}
                <Badge variant="secondary" className="ml-1 text-[9px] px-1 h-3.5">
                  {cat.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <Dialog open={isNewRecordOpen} onOpenChange={setIsNewRecordOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 shrink-0 ml-4 h-8 text-xs bg-blue-600 hover:bg-blue-700">
                <Plus className="h-3.5 w-3.5" /> Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Registro: {categories.find(c => c.id === activeTab)?.label}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome / Descrição</Label>
                  <Input id="name" placeholder="Digite o nome..." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code">Código / Sigla</Label>
                  <Input id="code" placeholder="Digite o código..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewRecordOpen(false)}>Cancelar</Button>
                <Button onClick={() => {
                  toast.success('Registro criado com sucesso!');
                  setIsNewRecordOpen(false);
                }}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar nesta tabela..."
            className="pl-9 h-9 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {categories.map(cat => (
          <TabsContent key={cat.id} value={cat.id}>
            <Card className="border-none shadow-sm">
              <CardContent className="p-0">
                {/* Table - Desktop */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-b">
                      <tr>
                        <th className="px-4 py-2 font-bold">ID</th>
                        <th className="px-4 py-2 font-bold">Nome / Descrição</th>
                        <th className="px-4 py-2 font-bold">Código / Sigla</th>
                        <th className="px-4 py-2 font-bold">Status</th>
                        <th className="px-4 py-2 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(mockData[cat.id] || []).map((item: any) => (
                        <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-4 py-2 font-mono text-[10px] text-zinc-400">#{item.id}</td>
                          <td className="px-4 py-2 font-medium text-xs">{item.nome}</td>
                          <td className="px-4 py-2 text-xs">{item.sigla || item.codigo || '-'}</td>
                          <td className="px-4 py-2">
                            <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'} className={cn(
                              "text-[9px] px-1.5 h-4",
                              item.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''
                            )}>
                              {item.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="gap-2 text-xs">
                                  <Edit2 className="h-3.5 w-3.5" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-red-600 text-xs">
                                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards - Mobile / Tablet */}
                <div className="lg:hidden space-y-3 p-4">
                  {(mockData[cat.id] || []).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] text-zinc-400 shrink-0">#{item.id}</span>
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{item.nome}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'} className={cn(
                            "text-[8px] px-1 h-3.5",
                            item.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : ''
                          )}>
                            {item.status}
                          </Badge>
                          <span className="text-[10px] text-zinc-500">{item.sigla || item.codigo || '-'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {(!mockData[cat.id] || mockData[cat.id].length === 0) && (
                  <div className="px-6 py-12 text-center text-zinc-500 italic text-sm">
                    Nenhum registro encontrado para esta categoria.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
