import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Users, 
  Settings, 
  Trash2, 
  Edit,
  LayoutGrid,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface Sector {
  id: string;
  name: string;
  userCount: number;
  description: string;
  color: string;
}

export function SectorManagement() {
  const [sectors, setSectors] = useState<Sector[]>([
    { id: '1', name: 'Comercial', userCount: 12, description: 'Vendas, Orçamentos e CRM', color: 'bg-blue-500' },
    { id: '2', name: 'Financeiro', userCount: 5, description: 'Contas a Pagar/Receber e Fluxo de Caixa', color: 'bg-emerald-500' },
    { id: '3', name: 'Técnico', userCount: 8, description: 'Ordens de Serviço e Manutenção', color: 'bg-amber-500' },
    { id: '4', name: 'Logística', userCount: 6, description: 'Entregas, Coletas e Frota', color: 'bg-violet-500' },
    { id: '5', name: 'Estoque', userCount: 4, description: 'Armazenagem e Inventário', color: 'bg-rose-500' },
    { id: '6', name: 'Diretoria', userCount: 3, description: 'Gestão Estratégica e Relatórios', color: 'bg-zinc-800' },
  ]);

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir este setor? Isso não excluirá os usuários vinculados.')) {
      setSectors(prev => prev.filter(s => s.id !== id));
      toast.success('Setor excluído com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar setores..." className="pl-8" />
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" /> Novo Setor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectors.map((sector) => (
          <Card key={sector.id} className="group hover:border-emerald-500/50 transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`h-10 w-10 rounded-xl ${sector.color} flex items-center justify-center text-white shadow-lg`}>
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(sector.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="mt-4">{sector.name}</CardTitle>
              <CardDescription className="line-clamp-1">{sector.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{sector.userCount} usuários</span>
                </div>
                <Button variant="link" size="sm" className="h-auto p-0 text-emerald-600">
                  <Shield className="mr-1 h-3 w-3" /> Permissões
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
