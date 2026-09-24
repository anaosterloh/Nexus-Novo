import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApp } from '@/context/AppContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Truck, Mail, Phone, MapPin, Calculator, ArrowRight, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { CarrierForm } from './CarrierForm';

interface Carrier {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  region: string;
  status: string;
}

export function CarrierList() {
  const { can } = usePermissions();
  const { currentCompany } = useApp();
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  
  const [simParams, setSimParams] = useState({
    weight: 10,
    volume: 0.5,
    value: 1500,
    destination: 'SP'
  });

  const [comparisonResults, setComparisonResults] = useState([
    { carrier: 'TransLog Brasil', region: 'Sudeste', basePrice: 45.00, kmPrice: 1.20, leadTime: '2-3 dias' },
    { carrier: 'Rápido Nexus', region: 'Sudeste', basePrice: 38.00, kmPrice: 1.45, leadTime: '1-2 dias' },
    { carrier: 'Sul Entregas', region: 'Sul', basePrice: 55.00, kmPrice: 1.10, leadTime: '3-5 dias' },
  ]);

  const handleSimulate = () => {
    const factor = simParams.destination === 'SP' ? 1 : simParams.destination === 'RJ' ? 1.2 : 1.5;
    
    const newResults = [
      { 
        carrier: 'TransLog Brasil', 
        region: 'Sudeste', 
        basePrice: 45.00 + (simParams.weight * 0.5) + (simParams.volume * 100) + (simParams.value * 0.001), 
        kmPrice: 1.20 * factor, 
        leadTime: '2-3 dias' 
      },
      { 
        carrier: 'Rápido Nexus', 
        region: 'Sudeste', 
        basePrice: 38.00 + (simParams.weight * 0.6) + (simParams.volume * 90) + (simParams.value * 0.0015), 
        kmPrice: 1.45 * factor, 
        leadTime: '1-2 dias' 
      },
      { 
        carrier: 'Sul Entregas', 
        region: 'Sul', 
        basePrice: 55.00 + (simParams.weight * 0.4) + (simParams.volume * 110) + (simParams.value * 0.0008), 
        kmPrice: 1.10 * factor, 
        leadTime: '3-5 dias' 
      },
    ];
    setComparisonResults(newResults);
  };

  const fetchCarriers = () => {
    if (currentCompany) {
      setLoading(true);
      fetch(`/api/carriers?companyId=${currentCompany.id}`)
        .then(res => res.json())
        .then(data => {
          setCarriers(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => {
          setCarriers([]);
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchCarriers();
  }, [currentCompany]);

  const handleAdd = () => {
    setSelectedCarrier(null);
    setIsFormOpen(true);
  };

  const handleEdit = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    setIsFormOpen(true);
  };

  const filtered = carriers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.document.includes(searchTerm)
  );

  const freightComparison = [
    { carrier: 'TransLog Brasil', region: 'Sudeste', basePrice: 45.00, kmPrice: 1.20, leadTime: '2-3 dias' },
    { carrier: 'Rápido Nexus', region: 'Sudeste', basePrice: 38.00, kmPrice: 1.45, leadTime: '1-2 dias' },
    { carrier: 'Sul Entregas', region: 'Sul', basePrice: 55.00, kmPrice: 1.10, leadTime: '3-5 dias' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Transportadoras & Fretes</h2>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
          <Button variant="outline" size="sm" className="gap-2 shrink-0 h-9">
            <Calculator className="h-4 w-4" /> Simular
          </Button>
          {can('edit_logistics') && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 shrink-0 h-9 font-bold" onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" /> Novo Parceiro
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Gestão de Parceiros</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    placeholder="Buscar transportadoras..."
                    className="pl-8 h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Table - Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transportadora</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Região</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10">Carregando...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-zinc-500">Nenhuma transportadora encontrada.</TableCell></TableRow>
                  ) : filtered.map((carrier) => (
                    <TableRow key={carrier.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Truck className="h-4 w-4" />
                          </div>
                          <span className="font-bold">{carrier.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono">{carrier.document}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3 text-zinc-400" /> {carrier.region}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs text-zinc-500">
                          <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {carrier.email}</div>
                          <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {carrier.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">{carrier.status || 'Ativo'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {can('edit_logistics') && (
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(carrier)}>Editar</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Cards - Mobile / Tablet */}
            <div className="lg:hidden space-y-4">
              {loading ? (
                <div className="text-center py-10 text-zinc-500">Carregando...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 text-zinc-500">Nenhum parceiro encontrado.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filtered.map((carrier) => (
                    <Card key={carrier.id} className="border-zinc-200 dark:border-zinc-800 shadow-none bg-zinc-50/50 dark:bg-zinc-900/50">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                              <Truck className="h-4 w-4" />
                            </div>
                            <span className="font-bold truncate">{carrier.name}</span>
                          </div>
                          <Badge variant="outline" className="shrink-0 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px]">
                            {carrier.status || 'Ativo'}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[10px] text-zinc-400 uppercase w-12">CNPJ:</span>
                            <span className="font-mono">{carrier.document}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <span>{carrier.region}</span>
                          </div>
                          <div className="flex flex-col gap-1.5 pt-1">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                              <span className="truncate">{carrier.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                              <span>{carrier.phone}</span>
                            </div>
                          </div>
                        </div>

                        {can('edit_logistics') && (
                          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                            <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => handleEdit(carrier)}>
                              Editar Parceiro
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Comparativo de Fretes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border space-y-3">
              <p className="text-xs font-bold uppercase text-zinc-500">Simulador Rápido</p>
              <div className="grid gap-2">
                <Label className="text-[10px]">Peso Estimado (kg)</Label>
                <Input 
                  type="number" 
                  value={simParams.weight}
                  onChange={(e) => setSimParams({...simParams, weight: Number(e.target.value)})}
                  className="h-8" 
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label className="text-[10px]">Volume (m³)</Label>
                  <Input 
                    type="number" 
                    value={simParams.volume}
                    onChange={(e) => setSimParams({...simParams, volume: Number(e.target.value)})}
                    className="h-8" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px]">Valor (R$)</Label>
                  <Input 
                    type="number" 
                    value={simParams.value}
                    onChange={(e) => setSimParams({...simParams, value: Number(e.target.value)})}
                    className="h-8" 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px]">Destino (UF)</Label>
                <Select 
                  value={simParams.destination} 
                  onValueChange={(val) => setSimParams({...simParams, destination: val})}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP">São Paulo (SP)</SelectItem>
                    <SelectItem value="RJ">Rio de Janeiro (RJ)</SelectItem>
                    <SelectItem value="MG">Minas Gerais (MG)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full h-8 text-xs bg-blue-600" onClick={handleSimulate}>Calcular Melhor Opção</Button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase text-zinc-500">Tabela de Custos</p>
              {comparisonResults.map((item, i) => (
                <div key={i} className="p-3 border rounded-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">{item.carrier}</span>
                    <Badge variant="secondary" className="text-[9px]">{item.leadTime}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Base:</span>
                      <span className="font-bold">R$ {item.basePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Por KM:</span>
                      <span className="font-bold">R$ {item.kmPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Button variant="ghost" className="w-full text-xs gap-2 text-blue-600">
              Ver Tabela Completa <ArrowRight className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <CarrierForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSuccess={fetchCarriers} 
        carrier={selectedCarrier} 
      />
    </div>
  );
}
