import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Package, 
  ShoppingBag,
  DollarSign, 
  Wrench, 
  FileText, 
  Truck, 
  BarChart3, 
  ShieldCheck, 
  MessageSquare, 
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  ClipboardList,
  CreditCard,
  Receipt,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Building2,
  CheckCircle2,
  MapPin,
  ShieldAlert,
  Zap,
  Bell,
  Beaker
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useLocation } from 'react-router-dom';
import { SidebarSection } from './SidebarSection';

import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/lib/permissions';
import { LucideIcon } from 'lucide-react';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  path?: string;
  subItems?: { label: string; path: string; icon?: LucideIcon }[];
  permission?: Permission;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', permission: 'view_dashboard' },
  { 
    icon: Clock, 
    label: 'Agendas e Compromissos', 
    subItems: [
      { label: 'Calendário', path: '/agenda', icon: Clock },
      { label: 'Agenda de Contatos', path: '/agenda/contatos', icon: Users },
      { label: 'Processos e Tarefas', path: '/processos/controle', icon: CheckCircle2 },
    ],
    permission: 'view_dashboard'
  },
  { 
    icon: Database, 
    label: 'Cadastros', 
    subItems: [
      { label: 'Revisão de Cadastros', path: '/cadastros/revisao', icon: ShieldAlert },
      { label: 'Geral (Compatibilidade)', path: '/cadastros/geral', icon: Users },
      { label: 'Entidades (Cadastro Geral)', path: '/cadastros/entidades', icon: Database },
      { label: 'Clientes', path: '/cadastros/clientes', icon: Users },
      { label: 'Fornecedores', path: '/cadastros/fornecedores', icon: ShoppingBag },
      { label: 'Produtos e Serviços', path: '/cadastros/produtos', icon: Package },
      { label: 'Estudos de Produtos', path: '/cadastros/estudos', icon: Beaker },
      { label: 'Transportadoras', path: '/cadastros/transportadoras', icon: Truck },
      { label: 'Veículos e Seguros', path: '/cadastros/veiculos', icon: ShieldCheck },
      { label: 'Tabelas e Listas', path: '/cadastros/tabelas', icon: ClipboardList },
    ],
    permission: 'view_dashboard'
  },
  { 
    icon: ShoppingBag, 
    label: 'Vendas', 
    subItems: [
      { label: 'Funil de Vendas (CRM)', path: '/comercial/crm', icon: TrendingUp },
      { label: 'Pedidos e Orçamentos', path: '/comercial/pedidos', icon: ShoppingCart },
      { label: 'Conferência de Vendas', path: '/vendas/conferencia', icon: CheckCircle2 },
      { label: 'Faturamento', path: '/comercial/faturamento', icon: Receipt },
      { label: 'Comissões', path: '/comercial/comissoes', icon: DollarSign },
      { label: 'Tabelas de Preço', path: '/comercial/precos', icon: BarChart3 },
      { label: 'Cartas Comerciais', path: '/comercial/cartas', icon: FileText },
    ],
    permission: 'view_sales'
  },
  { 
    icon: Package, 
    label: 'Estoque', 
    subItems: [
      { label: 'Dashboard Estratégico', path: '/estoque/dashboard', icon: LayoutDashboard },
      { label: 'Consulta de Saldo', path: '/estoque/saldo', icon: Search },
      { label: 'Entradas (NF-e)', path: '/estoque/entradas', icon: ArrowUpRight },
      { label: 'Solicitações de Compra', path: '/estoque/solicitacoes', icon: ClipboardList },
      { label: 'Compras e Cotações', path: '/estoque/compras', icon: ShoppingBag },
      { label: 'Movimentações', path: '/estoque/movimentacoes', icon: ArrowDownRight },
      { label: 'Inventário e Ajustes', path: '/estoque/inventario', icon: ClipboardList },
    ],
    permission: 'view_stock'
  },
  { 
    icon: DollarSign, 
    label: 'Financeiro', 
    subItems: [
      { label: 'Movimento Geral', path: '/financeiro/movimento', icon: TrendingUp },
      { label: 'Contas a Pagar', path: '/financeiro/pagar', icon: CreditCard },
      { label: 'Contas a Receber', path: '/financeiro/receber', icon: Receipt },
      { label: 'Fluxo de Caixa', path: '/financeiro/fluxo', icon: BarChart3 },
      { label: 'Bancos e Caixas', path: '/financeiro/bancos', icon: Building2 },
      { label: 'Conciliação', path: '/financeiro/conciliacao', icon: CheckCircle2 },
    ],
    permission: 'view_financials'
  },
  { 
    icon: Wrench, 
    label: 'Técnica', 
    subItems: [
      { label: 'Equipamentos', path: '/tecnica/equipamentos', icon: Building2 },
      { label: 'Ordens de Serviço', path: '/tecnica/os', icon: ClipboardList },
      { label: 'Laudos Técnicos', path: '/tecnica/laudos', icon: FileText },
    ],
    permission: 'view_service_orders'
  },
  { 
    icon: Truck, 
    label: 'Logística', 
    subItems: [
      { label: 'Ordens de Coleta', path: '/logistica/coletas', icon: Truck },
      { label: 'Mapa de Veículos', path: '/logistica/mapa', icon: MapPin },
      { label: 'Fretes e Contratos', path: '/logistica/fretes', icon: FileText },
    ],
    permission: 'view_logistics'
  },
  { 
    icon: FileText, 
    label: 'Fiscal', 
    subItems: [
      { label: 'Notas Fiscais', path: '/fiscal/notas', icon: FileText },
      { label: 'Apuração Impostos', path: '/fiscal/impostos', icon: DollarSign },
      { label: 'Config. Contábil', path: '/fiscal/config', icon: SettingsIcon },
    ],
    permission: 'view_fiscal'
  },
  { 
    icon: ShieldCheck, 
    label: 'Auditoria', 
    subItems: [
      { label: 'Logs do Sistema', path: '/auditoria/logs', icon: ClipboardList },
      { label: 'Acessos e Permissões', path: '/auditoria/acessos', icon: ShieldAlert },
    ],
    permission: 'view_audit'
  },
  { 
    icon: BarChart3, 
    label: 'Relatórios e Documentos', 
    subItems: [
      { label: 'Gerador de Relatórios', path: '/relatorios', icon: BarChart3 },
      { label: 'Controle de documentos', path: '/documentos/modelos', icon: FileText },
      { label: 'Checklists', path: '/cadastros/checklists', icon: ShieldCheck },
    ],
    permission: 'view_reports'
  },
  { 
    icon: MessageSquare, 
    label: 'Comunicações', 
    subItems: [
      { label: 'Mural de Notificações', path: '/comunicacoes/mural', icon: Bell },
      { label: 'Bate-papo Interno', path: '/comunicacoes/chat', icon: MessageSquare },
    ],
    permission: 'view_dashboard'
  },
  { 
    icon: SettingsIcon, 
    label: 'Configurações', 
    subItems: [
      { label: 'Parâmetros Gerais', path: '/configuracoes', icon: SettingsIcon },
      { label: 'Gerenciamento de APIs', path: '/configuracoes/apis', icon: Zap },
    ],
    permission: 'manage_users'
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openGroups, setOpenGroups] = useState<string[]>(['Cadastros', 'Pedidos']);
  const location = useLocation();
  const { can } = usePermissions();

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => 
      prev.includes(label) 
        ? prev.filter(g => g !== label) 
        : [...prev, label]
    );
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (item.permission && !can(item.permission)) return false;

    const matchesMain = item.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSub = item.subItems?.some(si => si.label.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesMain || matchesSub;
  }).map(item => {
    if (searchTerm && item.subItems) {
      // If searching, only show subitems that match
      const filteredSubs = item.subItems.filter(si => si.label.toLowerCase().includes(searchTerm.toLowerCase()));
      if (filteredSubs.length > 0) {
        return { ...item, subItems: filteredSubs };
      }
    }
    return item;
  });

  return (
    <aside className={cn(
      "relative flex flex-col border-r bg-white transition-all duration-300 dark:bg-zinc-900 h-screen",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-16 items-center justify-between px-4 shrink-0">
        {!collapsed && <span className="text-xl font-bold tracking-tight text-primary">NEXUS ERP</span>}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <Separator />

      {!collapsed && (
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <Input 
              placeholder="Buscar no menu..." 
              className="h-8 pl-8 text-xs bg-zinc-50 dark:bg-zinc-800/50 border-none focus-visible:ring-1 focus-visible:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-2 py-2 overflow-y-auto scrollbar-visible">
        <nav className="space-y-1 pb-20">
          {filteredMenuItems.map((item) => {
            const isActive = item.path ? location.pathname === item.path : item.subItems?.some(si => location.pathname === si.path);
            const isGroupOpen = searchTerm ? true : openGroups.includes(item.label);

            return (
              <SidebarSection
                key={item.label}
                icon={item.icon}
                label={item.label}
                path={item.path}
                subItems={item.subItems}
                collapsed={collapsed}
                isOpen={isGroupOpen}
                onToggle={() => toggleGroup(item.label)}
                isActive={isActive || false}
              />
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
