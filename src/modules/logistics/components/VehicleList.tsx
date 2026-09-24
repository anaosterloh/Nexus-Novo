import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Truck, 
  ShieldCheck, 
  Calendar, 
  AlertTriangle,
  Fuel,
  Gauge,
  Wrench,
  MapPin,
  Edit2,
  Trash2,
  FileText,
  Lock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  type: 'Carro' | 'Moto' | 'Caminhão' | 'Van';
  status: 'Disponível' | 'Em Rota' | 'Manutenção' | 'Sinistrado';
  km: number;
  nextMaintenance: string;
  insuranceExpiry: string;
}

export function VehicleList() {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewVehicleOpen, setIsNewVehicleOpen] = useState(false);

  if (!can('view_logistics')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar a lista de veículos.</p>
        </div>
      </div>
    );
  }

  const vehicles: Vehicle[] = [
    { 
      id: '1', 
      plate: 'ABC-1234', 
      model: 'Fiorino', 
      brand: 'Fiat', 
      year: 2022, 
      type: 'Van', 
      status: 'Em Rota', 
      km: 45200, 
      nextMaintenance: '2024-06-15', 
      insuranceExpiry: '2024-12-20' 
    },
    { 
      id: '2', 
      plate: 'XYZ-5678', 
      model: 'Hilux', 
      brand: 'Toyota', 
      year: 2023, 
      type: 'Carro', 
      status: 'Disponível', 
      km: 12500, 
      nextMaintenance: '2024-08-10', 
      insuranceExpiry: '2025-01-15' 
    },
    { 
      id: '3', 
      plate: 'KJH-9012', 
      model: 'CG 160', 
      brand: 'Honda', 
      year: 2021, 
      type: 'Moto', 
      status: 'Manutenção', 
      km: 28900, 
      nextMaintenance: '2024-03-25', 
      insuranceExpiry: '2024-11-05' 
    },
    { 
      id: '4', 
      plate: 'PLM-3344', 
      model: 'Daily', 
      brand: 'Iveco', 
      year: 2020, 
      type: 'Caminhão', 
      status: 'Disponível', 
      km: 158000, 
      nextMaintenance: '2024-05-01', 
      insuranceExpiry: '2024-10-10' 
    },
  ];

  const getStatusBadge = (status: Vehicle['status']) => {
    switch (status) {
      case 'Disponível': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Disponível</Badge>;
      case 'Em Rota': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Em Rota</Badge>;
      case 'Manutenção': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Manutenção</Badge>;
      case 'Sinistrado': return <Badge variant="destructive">Sinistrado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Veículos e Seguros</h2>
          <p className="text-zinc-500">Gestão da frota, manutenções preventivas e controle de seguros.</p>
        </div>
        {can('edit_logistics') && (
          <Dialog open={isNewVehicleOpen} onOpenChange={setIsNewVehicleOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus className="h-4 w-4" /> Novo Veículo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Veículo</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input id="model" placeholder="Ex: Fiorino" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input id="brand" placeholder="Ex: Fiat" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="plate">Placa</Label>
                  <Input id="plate" placeholder="ABC-1234" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="year">Ano</Label>
                  <Input id="year" type="number" placeholder="2024" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carro">Carro</SelectItem>
                      <SelectItem value="moto">Moto</SelectItem>
                      <SelectItem value="caminhao">Caminhão</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="km">KM Atual</Label>
                  <Input id="km" type="number" placeholder="0" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewVehicleOpen(false)}>Cancelar</Button>
                <Button onClick={() => {
                  toast.success('Veículo cadastrado com sucesso!');
                  setIsNewVehicleOpen(false);
                }}>Salvar Veículo</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Frota Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Em Operação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Manutenção Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">3</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Seguros a Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">2</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input 
            placeholder="Buscar por placa, modelo ou marca..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" /> Cronograma
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="overflow-hidden hover:border-blue-500 transition-colors shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold leading-none">{vehicle.model}</h3>
                    <p className="text-sm text-zinc-500">{vehicle.brand} • {vehicle.year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(vehicle.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {can('edit_logistics') && (
                        <>
                          <DropdownMenuItem className="gap-2"><Edit2 className="h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2"><Wrench className="h-4 w-4" /> Registrar Manutenção</DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem className="gap-2"><ShieldCheck className="h-4 w-4" /> Dados do Seguro</DropdownMenuItem>
                      {can('edit_logistics') && (
                        <DropdownMenuItem className="gap-2 text-rose-600"><Trash2 className="h-4 w-4" /> Excluir</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                  <Gauge className="h-4 w-4 text-zinc-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold">Quilometragem</span>
                    <span className="text-sm font-bold">{vehicle.km.toLocaleString()} KM</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                  <FileText className="h-4 w-4 text-zinc-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold">Placa</span>
                    <span className="text-sm font-bold font-mono">{vehicle.plate}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Wrench className="h-3 w-3" /> Próxima Manutenção
                  </div>
                  <span className={cn(
                    "font-medium",
                    new Date(vehicle.nextMaintenance) < new Date() ? "text-rose-600 font-bold" : "text-zinc-700"
                  )}>
                    {new Date(vehicle.nextMaintenance).toLocaleDateString('pt-BR')}
                    {new Date(vehicle.nextMaintenance) < new Date() && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <ShieldCheck className="h-3 w-3" /> Vencimento Seguro
                  </div>
                  <span className="font-medium text-zinc-700">
                    {new Date(vehicle.insuranceExpiry).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-3 border-t flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <MapPin className="h-3 w-3" /> Última localização: Sede Principal
              </div>
              <Button variant="link" size="sm" className="h-auto p-0 text-blue-600 text-xs font-bold">
                Ver Histórico Completo
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
