import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Wrench, Building2, User, AlertTriangle } from 'lucide-react';
import { equipmentService } from './equipmentService';
import { Equipment } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import EquipmentForm from './EquipmentForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';

export default function EquipmentList() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Customers Map
  const [customersMap, setCustomersMap] = useState<Record<string, string>>({});
  
  // Filters
  const [search, setSearch] = useState('');
  const [ownership, setOwnership] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  // Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const fallbackCustomers = [
    { id: 'cust_1', name: 'João Silva' },
    { id: 'cust_2', name: 'Empresa ABC Ltda' },
    { id: 'cust_3', name: 'Maria Oliveira' },
    { id: 'cust_4', name: 'Tech Solutions SA' },
  ];

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/sales/customers?companyId=comp_1');
      const data = await res.json();
      const map: Record<string, string> = {};
      if (Array.isArray(data) && data.length > 0) {
        data.forEach(c => { map[c.id] = c.name; });
      } else {
        // TODO: remover fallback fixo quando o módulo de clientes estiver consolidado como fonte única.
        fallbackCustomers.forEach(c => { map[c.id] = c.name; });
      }
      setCustomersMap(map);
    } catch {
      const map: Record<string, string> = {};
      fallbackCustomers.forEach(c => { map[c.id] = c.name; });
      setCustomersMap(map);
    }
  };

  const fetchEquipments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await equipmentService.getEquipments({
        search: search || undefined,
        ownership: ownership !== 'all' ? ownership as 'company' | 'customer' : undefined,
        status: status !== 'all' ? status : undefined,
      });
      setEquipments(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar equipamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchEquipments();
  }, [ownership, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEquipments();
  };

  const handleStatusChange = async (eqId: string, newStatus: string) => {
    try {
      await equipmentService.changeStatus(eqId, newStatus);
      fetchEquipments();
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar status');
    }
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-zinc-100 text-zinc-800',
    maintenance: 'bg-orange-100 text-orange-800',
    blocked: 'bg-red-100 text-red-800',
    discarded: 'bg-zinc-800 text-zinc-100',
  };

  const statusLabels: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    maintenance: 'Em Manutenção',
    blocked: 'Bloqueado',
    discarded: 'Descartado',
  };

  // Stats
  const total = equipments.length;
  const totalCustomer = equipments.filter(e => e.ownership_type === 'customer').length;
  const totalCompany = equipments.filter(e => e.ownership_type === 'company').length;
  const totalWarning = equipments.filter(e => e.operational_status === 'maintenance' || e.operational_status === 'blocked').length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    // Format simple DD/MM/YYYY HH:mm without external libs
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Equipamentos</h1>
          <p className="text-sm text-zinc-500">Gerencie ativos da empresa e de clientes</p>
        </div>
        <Button onClick={() => { setSelectedEquipment(null); setIsFormOpen(true); }} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9">
          <Plus className="w-4 h-4 mr-2" />
          Novo Equipamento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* ... stats cards ... keeping the same */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Total</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">De Clientes</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalCustomer}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Da Empresa</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalCompany}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Atenção</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalWarning}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input 
                placeholder="Buscar por nome, marca, modelo, serial ou patrimônio..." 
                className="pl-9 dark:bg-zinc-950"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={ownership} onValueChange={setOwnership}>
              <SelectTrigger className="w-[180px] dark:bg-zinc-950">
                <SelectValue placeholder="Tipo de posse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as posses</SelectItem>
                <SelectItem value="customer">De Clientes</SelectItem>
                <SelectItem value="company">Da Empresa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px] dark:bg-zinc-950">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="maintenance">Em Manutenção</SelectItem>
                <SelectItem value="blocked">Bloqueados</SelectItem>
                <SelectItem value="discarded">Descartados</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary" className="dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">Filtrar</Button>
          </form>
        </div>

        <div className="overflow-x-auto">
          {error && <div className="p-4 text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 text-sm border-b border-red-100 dark:border-red-900/50">{error}</div>}
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 uppercase border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium">Equipamento</th>
                <th className="px-4 py-3 font-medium">Posse / Cliente</th>
                <th className="px-4 py-3 font-medium">Marca / Modelo</th>
                <th className="px-4 py-3 font-medium">Série / Patrimônio</th>
                <th className="px-4 py-3 font-medium">Status / Atualização</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Carregando...</td>
                </tr>
              ) : equipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Nenhum equipamento encontrado</td>
                </tr>
              ) : (
                equipments.map((eq) => (
                  <tr key={eq.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{eq.name}</div>
                      {eq.equipment_type && <div className="text-xs text-zinc-500">{eq.equipment_type}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {eq.ownership_type === 'customer' ? <User className="w-3.5 h-3.5 text-emerald-600" /> : <Building2 className="w-3.5 h-3.5 text-blue-600" />}
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">{eq.ownership_type === 'customer' ? 'Cliente' : 'Empresa'}</span>
                      </div>
                      {eq.ownership_type === 'customer' && eq.customer_id && (
                        <div className="mt-1">
                          <div className="text-sm text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]" title={customersMap[eq.customer_id] || 'Cliente vinculado'}>
                            {customersMap[eq.customer_id] || 'Cliente vinculado'}
                          </div>
                          <div className="text-xs text-zinc-500">
                            ID: {eq.customer_id}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      <div>{eq.brand || '-'}</div>
                      <div className="text-xs text-zinc-500">{eq.model || '-'}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                      <div>S/N: {eq.serial_number || '-'}</div>
                      <div className="text-zinc-500">PAT: {eq.patrimony || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1.5">
                        <Badge className={`${statusColors[eq.operational_status] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'} shadow-none`} variant="secondary">
                          {statusLabels[eq.operational_status] || eq.operational_status}
                        </Badge>
                        <div className="text-xs text-zinc-500" title="Atualizado em">
                          {formatDate(eq.updated_at || eq.created_at)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Select 
                          value={eq.operational_status} 
                          onValueChange={(val) => handleStatusChange(eq.id, val)}
                        >
                          <SelectTrigger className="h-8 w-[130px] text-xs dark:bg-zinc-950 dark:border-zinc-700 shadow-none">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            <SelectItem value="maintenance">Em manutenção</SelectItem>
                            <SelectItem value="blocked">Bloqueado</SelectItem>
                            <SelectItem value="discarded">Descartado</SelectItem>
                          </SelectContent>
                        </Select>

                        <Link to={`/tecnica/equipamentos/${eq.id}`}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 shadow-none dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            >
                              Detalhes
                            </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 shadow-none dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          onClick={() => { setSelectedEquipment(eq); setIsFormOpen(true); }}
                        >
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-zinc-950 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="dark:text-zinc-100">{selectedEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
            <DialogDescription className="sr-only">
              Formulário para gerenciamento de equipamentos e ativos técnicos.
            </DialogDescription>
          </DialogHeader>

          <EquipmentForm 
            equipment={selectedEquipment} 
            onSuccess={() => {
              setIsFormOpen(false);
              fetchEquipments();
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
