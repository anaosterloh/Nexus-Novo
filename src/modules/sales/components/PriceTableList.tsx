import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Filter, 
  Tag, 
  Calendar, 
  MoreHorizontal, 
  Eye, 
  Copy, 
  Trash2,
  AlertCircle,
  Lock
} from 'lucide-react';
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
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const mockTables = [
  { id: '1', name: 'Tabela Geral 2024', status: 'Ativa', validUntil: '31/12/2024', region: 'Nacional', items: 1250, markup: '30%' },
  { id: '2', name: 'Tabela Revendedores SP', status: 'Ativa', validUntil: '30/06/2024', region: 'Sudeste', items: 850, markup: '15%' },
  { id: '3', name: 'Tabela Black Friday', status: 'Inativa', validUntil: '30/11/2023', region: 'Nacional', items: 500, markup: '10%' },
  { id: '4', name: 'Tabela Exportação USD', status: 'Ativa', validUntil: '31/12/2024', region: 'Internacional', items: 300, markup: '50%' },
];

export function PriceTableList() {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!can('view_sales')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar as tabelas de preços.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tabelas de Preços</h2>
          <p className="text-muted-foreground">Gerencie diferentes listas de preços por região, cliente ou período.</p>
        </div>
        {can('edit_sales') && (
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Tabela
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Buscar por nome ou região..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTables.map((table) => (
          <Card key={table.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant={table.status === 'Ativa' ? 'default' : 'secondary'} className={table.status === 'Ativa' ? 'bg-emerald-100 text-emerald-700' : ''}>
                  {table.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> Ver Itens</DropdownMenuItem>
                    {can('edit_sales') && (
                      <>
                        <DropdownMenuItem className="gap-2"><Copy className="h-4 w-4" /> Duplicar</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-red-600"><Trash2 className="h-4 w-4" /> Excluir</DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardTitle className="text-lg font-bold mt-2">{table.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Região</p>
                  <p className="font-medium">{table.region}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Validade</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-zinc-400" />
                    <p className="font-medium">{table.validUntil}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Itens</p>
                  <p className="font-medium">{table.items} produtos</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Markup Base</p>
                  <p className="font-bold text-emerald-600">{table.markup}</p>
                </div>
              </div>
              {can('edit_sales') && (
                <Button variant="outline" className="w-full text-xs h-8">Gerenciar Preços</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-emerald-600" />
              Nova Tabela de Preços
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Tabela</Label>
              <Input placeholder="Ex: Tabela Promocional Verão" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Região</Label>
                <Select defaultValue="nacional">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nacional">Nacional</SelectItem>
                    <SelectItem value="sudeste">Sudeste</SelectItem>
                    <SelectItem value="sul">Sul</SelectItem>
                    <SelectItem value="internacional">Internacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Validade</Label>
                <Input type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Markup Base (%)</Label>
              <Input type="number" placeholder="30" />
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <p className="text-[10px] text-amber-700">Ao criar uma nova tabela, você poderá importar os preços de uma tabela existente ou definir novos valores manualmente por item.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700">Criar Tabela</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
