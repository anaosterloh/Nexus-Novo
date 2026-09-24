import React, { useState, useEffect } from 'react';
import { Entity, EntityRole } from './types';
import { entityService } from './entityService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Building2, UserPlus, Search, SearchX, 
  Phone, Mail, MoreHorizontal, Pencil, CopyCheck, AlertTriangle
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EntityForm } from './EntityForm';
import { EntityQuickCreate } from './EntityQuickCreate';
import { EntityDetails } from './EntityDetails';

type EntityListProps = {
  viewRole?: EntityRole | 'all';
  title?: string;
};

export const EntityList: React.FC<EntityListProps> = ({ viewRole = 'all', title }) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchTrigger, setSearchTrigger] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const getPageTitle = () => {
    if (title) return title;
    if (viewRole === 'customer') return 'Clientes';
    if (viewRole === 'supplier') return 'Fornecedores';
    if (viewRole === 'carrier') return 'Transportadoras';
    return 'Cadastro Geral de Entidades';
  };

  const loadEntities = async () => {
    setLoading(true);
    try {
      const data = await entityService.getEntities(
        (viewRole !== 'all' ? viewRole : undefined) as any,
        searchTrigger || undefined
      );
      setEntities(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntities();
  }, [viewRole, searchTrigger]);

  const total = entities.length;
  const active = entities.filter(e => e.status === 'active').length;
  const pending = entities.filter(e => e.status === 'temporary' || e.review_status === 'pending_review').length;
  const blocked = entities.filter(e => e.status === 'blocked').length;

  const roleNameMap: Record<string, string> = {
    customer: 'Cliente',
    supplier: 'Fornecedor',
    carrier: 'Transportadora',
    manufacturer: 'Fabricante',
    partner: 'Parceiro',
    prospect: 'Prospect'
  };

  const statusNameMap: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
    active: { label: 'Ativo', variant: 'default' },
    temporary: { label: 'Temporário', variant: 'secondary' },
    inactive: { label: 'Inativo', variant: 'outline' },
    blocked: { label: 'Bloqueado', variant: 'destructive' },
  };

  const handleEdit = (id: string) => {
    setSelectedEntityId(id);
    setShowFormModal(true);
  };

  const handleViewDetails = (id: string) => {
    setSelectedEntityId(id);
    setShowDetailsModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{getPageTitle()}</h1>
          <p className="text-sm text-zinc-500 mt-1">Gerencie os cadastros do sistema.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none h-9 text-xs sm:text-sm" onClick={() => setShowQuickCreateModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Pré-cadastro
          </Button>
          <Button className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 h-9 text-xs sm:text-sm font-bold" onClick={() => { setSelectedEntityId(null); setShowFormModal(true); }}>
            <Building2 className="mr-2 h-4 w-4" />
            Novo Cadastro
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CopyCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{active}</div>
          </CardContent>
        </Card>
        {viewRole !== 'supplier' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes / Temporários</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{pending}</div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bloqueados</CardTitle>
            <SearchX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{blocked}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input 
            placeholder="Buscar por nome, documento, email ou telefone..." 
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') setSearchTrigger(search);
            }}
          />
        </div>
        <Button onClick={() => setSearchTrigger(search)}>Filtrar</Button>
      </div>

      {/* Table - Desktop */}
      <div className="hidden lg:block bg-white dark:bg-zinc-900 border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Documento</th>
                <th className="px-4 py-3 font-medium">Contatos</th>
                <th className="px-4 py-3 font-medium">Papéis</th>
                <th className="px-4 py-3 font-medium">Status / Revisão</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    Carregando entidades...
                  </td>
                </tr>
              ) : entities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    Nenhum cadastro encontrado.
                  </td>
                </tr>
              ) : (
                entities.map(entity => (
                  <tr key={entity.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{entity.trade_name || entity.display_name}</div>
                      {(entity.legal_name && entity.legal_name !== entity.trade_name && entity.legal_name !== entity.display_name) && (
                        <div className="text-xs text-zinc-500">{entity.legal_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {entity.document || '-'}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {entity.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3"/> {entity.email}</div>}
                      {entity.phone && <div className="flex items-center gap-1 mt-1"><Phone className="w-3 h-3"/> {entity.phone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {entity.is_customer === 1 && <Badge variant="secondary">Cliente</Badge>}
                        {entity.is_supplier === 1 && <Badge variant="secondary">Fornecedor</Badge>}
                        {entity.is_carrier === 1 && <Badge variant="secondary">Transportadora</Badge>}
                        {entity.is_manufacturer === 1 && <Badge variant="secondary">Fabricante</Badge>}
                        {entity.is_partner === 1 && <Badge variant="secondary">Parceiro</Badge>}
                        {entity.is_prospect === 1 && <Badge variant="secondary">Prospect</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant={statusNameMap[entity.status]?.variant || 'default'}>
                          {statusNameMap[entity.status]?.label || entity.status}
                        </Badge>
                        {entity.review_status === 'pending_review' && (
                          <span className="text-[10px] uppercase font-semibold text-amber-600">Revisão Pendente</span>
                        )}
                        {entity.quick_register === 1 && (
                          <span className="text-[10px] uppercase font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1 rounded">Pré-cadastro</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(entity.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar Cadastro
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewDetails(entity.id)}>
                            <Building2 className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards - Mobile / Tablet */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <div className="text-center py-10 bg-white dark:bg-zinc-900 border rounded-lg text-zinc-500">
            Carregando cadastros...
          </div>
        ) : entities.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-zinc-900 border rounded-lg text-zinc-500">
            Nenhum cadastro encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {entities.map(entity => (
              <Card key={entity.id} className="overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {entity.trade_name || entity.display_name}
                      </h3>
                      {(entity.legal_name && entity.legal_name !== entity.trade_name) && (
                        <p className="text-xs text-zinc-500 truncate">{entity.legal_name}</p>
                      )}
                    </div>
                    <Badge variant={statusNameMap[entity.status]?.variant || 'default'} className="shrink-0 text-[10px] h-5">
                      {statusNameMap[entity.status]?.label || entity.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {entity.document && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase w-16">DOC:</span>
                        <span className="font-mono text-xs">{entity.document}</span>
                      </div>
                    )}
                    {(entity.email || entity.phone) && (
                      <div className="flex flex-col gap-1.5 pt-1">
                        {entity.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <span className="truncate text-xs">{entity.email}</span>
                          </div>
                        )}
                        {entity.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <span className="text-xs">{entity.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {entity.is_customer === 1 && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Cliente</Badge>}
                    {entity.is_supplier === 1 && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Fornecedor</Badge>}
                    {entity.is_carrier === 1 && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Transportadora</Badge>}
                    {entity.is_manufacturer === 1 && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Fabricante</Badge>}
                    {entity.is_partner === 1 && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Parceiro</Badge>}
                    {entity.is_prospect === 1 && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Prospect</Badge>}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-medium" onClick={() => handleEdit(entity.id)}>
                      <Pencil className="mr-1.5 h-3 w-3" /> Editar
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1 h-8 text-xs font-medium" onClick={() => handleViewDetails(entity.id)}>
                      <Building2 className="mr-1.5 h-3 w-3" /> Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showFormModal && (
        <EntityForm 
          entityId={selectedEntityId} 
          defaultRole={viewRole !== 'all' ? viewRole : undefined}
          onClose={() => setShowFormModal(false)} 
          onSave={() => { setShowFormModal(false); loadEntities(); }} 
        />
      )}
      
      {showQuickCreateModal && (
        <EntityQuickCreate 
          defaultRole={viewRole !== 'all' ? viewRole : undefined}
          onClose={() => setShowQuickCreateModal(false)}
          onSave={() => { setShowQuickCreateModal(false); loadEntities(); }}
        />
      )}
      
      {showDetailsModal && selectedEntityId && (
        <EntityDetails 
          entityId={selectedEntityId} 
          onClose={() => setShowDetailsModal(false)} 
        />
      )}
    </div>
  );
};
