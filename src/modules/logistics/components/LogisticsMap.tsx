import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Truck, 
  Navigation, 
  Search, 
  Filter, 
  Layers, 
  Maximize2,
  Plus,
  Clock,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VehicleLocation {
  id: string;
  plate: string;
  driver: string;
  status: 'Em Movimento' | 'Parado' | 'Atrasado' | 'Concluído';
  lastUpdate: string;
  location: string;
  destination: string;
  progress: number;
}

export function LogisticsMap() {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  if (!can('view_logistics')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para visualizar o mapa de logística.</p>
        </div>
      </div>
    );
  }

  const vehicles: VehicleLocation[] = [
    { 
      id: '1', 
      plate: 'ABC-1234', 
      driver: 'João Silva', 
      status: 'Em Movimento', 
      lastUpdate: '2 min atrás', 
      location: 'Av. Paulista, 1000', 
      destination: 'Rua Augusta, 500', 
      progress: 65 
    },
    { 
      id: '2', 
      plate: 'XYZ-5678', 
      driver: 'Maria Santos', 
      status: 'Parado', 
      lastUpdate: '15 min atrás', 
      location: 'Rua das Flores, 123', 
      destination: 'Av. Brasil, 2000', 
      progress: 30 
    },
    { 
      id: '3', 
      plate: 'KJH-9012', 
      driver: 'Pedro Oliveira', 
      status: 'Atrasado', 
      lastUpdate: '1 min atrás', 
      location: 'Rodovia dos Bandeirantes, KM 45', 
      destination: 'Campinas - Centro', 
      progress: 85 
    },
    { 
      id: '4', 
      plate: 'PLM-3344', 
      driver: 'Ana Costa', 
      status: 'Concluído', 
      lastUpdate: '10 min atrás', 
      location: 'Sede Principal', 
      destination: 'Sede Principal', 
      progress: 100 
    },
  ];

  const getStatusColor = (status: VehicleLocation['status']) => {
    switch (status) {
      case 'Em Movimento': return 'bg-blue-500';
      case 'Parado': return 'bg-zinc-400';
      case 'Atrasado': return 'bg-rose-500';
      case 'Concluído': return 'bg-emerald-500';
      default: return 'bg-zinc-500';
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mapa de Veículos</h2>
          <p className="text-zinc-500">Acompanhamento em tempo real da frota e rotas de entrega.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Layers className="h-4 w-4" /> Camadas
          </Button>
          {can('edit_logistics') && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Navigation className="h-4 w-4" /> Otimizar Rotas
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Sidebar List */}
        <div className="w-80 flex flex-col gap-4 shrink-0 overflow-y-auto pr-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input 
              placeholder="Buscar veículo ou motorista..." 
              className="pl-10 h-9 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {vehicles.map((v) => (
              <Card key={v.id} className="cursor-pointer hover:border-blue-500 transition-colors shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", getStatusColor(v.status))} />
                      <span className="text-xs font-bold font-mono">{v.plate}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400">{v.lastUpdate}</span>
                  </div>
                  <p className="text-sm font-bold mb-1">{v.driver}</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-[10px] text-zinc-500">
                      <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                      <span className="line-clamp-1">{v.location}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Progresso da Rota</span>
                        <span className="font-bold">{v.progress}%</span>
                      </div>
                      <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full", getStatusColor(v.status))} 
                          style={{ width: `${v.progress}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative rounded-xl border bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
          {/* Mock Map Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0" style={{ 
              backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
              backgroundSize: '40px 40px' 
            }} />
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button variant="secondary" size="icon" className="h-8 w-8 shadow-md"><Plus className="h-4 w-4" /></Button>
            <Button variant="secondary" size="icon" className="h-8 w-8 shadow-md"><Maximize2 className="h-4 w-4" /></Button>
          </div>

          {/* Vehicle Markers */}
          <div className="absolute top-1/4 left-1/3 group cursor-pointer">
            <div className="relative">
              <div className="absolute -top-12 -left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 p-2 rounded shadow-lg border hidden group-hover:block w-32 z-10">
                <p className="text-[10px] font-bold">ABC-1234</p>
                <p className="text-[8px] text-zinc-500">João Silva</p>
                <div className="mt-1 flex items-center gap-1">
                  <Badge className="text-[8px] h-4 px-1">Em Movimento</Badge>
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white shadow-lg animate-bounce">
                <Truck className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="absolute bottom-1/3 right-1/4 group cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-white shadow-lg">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-zinc-800/90 backdrop-blur p-3 rounded-lg border shadow-sm flex gap-4 text-[10px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-blue-500" /> Movimento</div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-zinc-400" /> Parado</div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-rose-500" /> Atraso</div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Concluído</div>
          </div>
        </div>
      </div>
    </div>
  );
}
