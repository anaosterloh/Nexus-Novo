import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  MapPin, 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Navigation,
  Fuel,
  Wrench,
  Lock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleStatusBadge } from '@/components/common/ModuleStatusBadge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';

export function LogisticsDashboard({ defaultTab = 'coletas' }: { defaultTab?: string }) {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  const coletas = [
    { id: 'COL-001', cliente: 'Hospital Central', local: 'São Paulo - SP', status: 'Em Rota', motorista: 'João Silva', veiculo: 'Caminhão 01' },
    { id: 'COL-002', cliente: 'Clínica Vida', local: 'Campinas - SP', status: 'Pendente', motorista: 'Marcos Souza', veiculo: 'Furgão 02' },
    { id: 'COL-003', cliente: 'Lab Exame', local: 'Santos - SP', status: 'Concluído', motorista: 'Ricardo Lima', veiculo: 'Caminhão 03' },
  ];

  const veiculos = [
    { id: 'ABC-1234', modelo: 'Mercedes-Benz Accelo', status: 'Disponível', km: '45.200', manutencao: '20/05/2024' },
    { id: 'XYZ-5678', modelo: 'Iveco Daily', status: 'Em Rota', km: '12.800', manutencao: '15/06/2024' },
    { id: 'KJH-9012', modelo: 'Volkswagen Delivery', status: 'Manutenção', km: '88.500', manutencao: 'Atrasada' },
  ];

  if (!can('view_logistics')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar o painel de logística.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Logística e Frotas</h2>
            <ModuleStatusBadge status="Visual" />
          </div>
          <p className="text-zinc-500">Controle de coletas, entregas e manutenção de veículos.</p>
        </div>
        {can('edit_logistics') && (
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
            <Navigation className="h-4 w-4" /> Nova Ordem de Coleta
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Veículos em Rota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Coletas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">8</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Consumo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">8.5 km/L</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Alertas Manut.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">2</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={defaultTab === 'fretes' ? 'coletas' : defaultTab} className="w-full">
        <TabsList>
          <TabsTrigger value="coletas" className="gap-2"><Truck className="h-4 w-4" /> Ordens de Coleta</TabsTrigger>
          <TabsTrigger value="veiculos" className="gap-2"><Navigation className="h-4 w-4" /> Mapa da Frota</TabsTrigger>
          <TabsTrigger value="manutencao" className="gap-2"><Wrench className="h-4 w-4" /> Manutenção</TabsTrigger>
        </TabsList>

        <TabsContent value="coletas" className="mt-6 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input placeholder="Buscar coletas..." className="pl-10" />
            </div>
            <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filtros</Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente / Local</TableHead>
                    <TableHead>Motorista / Veículo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coletas.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold">{item.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.cliente}</span>
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {item.local}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{item.motorista}</span>
                          <span className="text-[10px] text-zinc-400">{item.veiculo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'Concluído' ? 'default' : 'outline'} className={
                          item.status === 'Em Rota' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          item.status === 'Pendente' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''
                        }>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Detalhes</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="veiculos" className="mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            {veiculos.map((v) => (
              <Card key={v.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="font-mono">{v.id}</Badge>
                    <Badge className={
                      v.status === 'Disponível' ? 'bg-emerald-500' : 
                      v.status === 'Em Rota' ? 'bg-blue-500' : 'bg-rose-500'
                    }>{v.status}</Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">{v.modelo}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Kilometragem:</span>
                    <span className="font-bold">{v.km} km</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Próx. Manutenção:</span>
                    <span className={v.manutencao === 'Atrasada' ? 'text-rose-600 font-bold' : 'font-medium'}>
                      {v.manutencao}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">Histórico</Button>
                    {can('edit_logistics') && (
                      <Button variant="outline" size="sm" className="flex-1"><Fuel className="h-4 w-4 mr-2" /> Abastecer</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
