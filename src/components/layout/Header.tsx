import { 
  Bell, 
  MessageSquare, 
  Settings, 
  User, 
  Building2, 
  MapPin, 
  ShieldAlert,
  Search,
  LogOut,
  CreditCard,
  HelpCircle,
  Mail,
  Eye,
  EyeOff,
  Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { ThemeSwitcher } from './ThemeSwitcher';

import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { notificationService } from '@/modules/notifications/notificationService';
import { NotificationItem, NotificationSummary } from '@/modules/notifications/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Header() {
  const navigate = useNavigate();
  const { currentCompany, currentBranch, user: fallbackUser, companies, branches, setCompany, setBranch, setUserRole } = useApp();
  const { showSensitiveData, toggleSensitiveData, fontSize, setFontSize } = usePrivacy();
  const { user, logout } = useAuth();
  
  const displayUser = user || fallbackUser;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [summary, setSummary] = useState<NotificationSummary | null>(null);

  useEffect(() => {
    if (!currentCompany || !displayUser) return;
    
    // Load unread and urgent notifications for the dropdown
    const loadNotifs = async () => {
      try {
        const params = {
          companyId: currentCompany.id,
          userId: displayUser.id,
          role: displayUser.role,
          department: (displayUser as any).department || 'admin'
        };
        const [notifs, sum] = await Promise.all([
          notificationService.listNotifications(params),
          notificationService.getNotificationSummary(params)
        ]);
        setNotifications(notifs.slice(0, 5)); // First 5 for dropdown
        setSummary(sum);
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };

    loadNotifs();
    // Simplified polling
    const interval = setInterval(loadNotifs, 15000);
    return () => clearInterval(interval);
  }, [currentCompany, displayUser]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex w-full min-w-0 h-16 items-center justify-between border-b bg-white px-3 md:px-6 dark:bg-zinc-900 sticky top-0 z-50">
      <div className="flex flex-1 min-w-0 items-center gap-1 md:gap-4 pr-2">
        {/* Company Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 max-w-[100px] sm:max-w-[150px] md:max-w-[200px]">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{currentCompany?.name || 'Empresa'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Empresas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {companies.map((company) => (
              <DropdownMenuItem key={company.id} onClick={() => setCompany(company)}>
                {company.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Branch Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 border-l pl-4 rounded-none max-w-[120px] md:max-w-[200px]">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{currentBranch?.name || 'Filial'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filiais</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {branches.map((branch) => (
              <DropdownMenuItem key={branch.id} onClick={() => setBranch(branch)}>
                {branch.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Temporary Role Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-bold text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 ml-1 md:ml-4 max-w-[80px] md:max-w-none px-2 h-7 md:h-8">
              <ShieldAlert className="h-3 w-3 shrink-0" />
              <span className="truncate hidden md:inline">SETOR: {displayUser?.role?.toUpperCase()}</span>
              <span className="truncate md:hidden">{displayUser?.role?.toUpperCase()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Simular Setor</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setUserRole('admin')}>Administrador</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setUserRole('manager')}>Gerente</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setUserRole('sales')}>Vendedor</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setUserRole('stock')}>Estoquista</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setUserRole('finance')}>Financeiro</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setUserRole('tech')}>Técnico</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 min-w-0 max-w-md mx-4 hidden lg:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
          <Input 
            placeholder="Pesquisar..." 
            className="w-full pl-10 bg-zinc-50 dark:bg-zinc-800/50 border-none focus-visible:ring-1 focus-visible:ring-emerald-500 h-9 text-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-zinc-100 px-1.5 font-mono text-[10px] font-medium text-zinc-500 opacity-100 dark:bg-zinc-900">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 ml-auto items-center gap-1 md:gap-2">
        {/* Privacy Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSensitiveData}
          title={showSensitiveData ? "Ocultar valores" : "Mostrar valores"}
          className="hidden md:flex h-9 w-9"
        >
          {showSensitiveData ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5 text-zinc-400" />}
        </Button>


        {/* Font Size Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Tamanho da fonte" className="hidden sm:flex">
              <Type className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Tamanho da Fonte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={fontSize} onValueChange={(v) => setFontSize(v as any)}>
              <DropdownMenuRadioItem value="sm">Pequena</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="base">Média (Padrão)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="lg">Grande</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="xl">Extra Grande</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden sm:flex">
          <ThemeSwitcher />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {(summary?.unread || 0) > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-zinc-900" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificações</span>
              {(summary?.unread || 0) > 0 && (
                <Badge variant="secondary" className="text-[10px]">{summary?.unread} Novas</Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500">Nenhuma notificação nova</div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id}>
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer" onClick={() => {
                        notificationService.markAsRead(notif.id).then(() => {
                           navigate('/comunicacoes/mural');
                        });
                      }}>
                      <div className="flex items-center gap-2 w-full">
                        <div className={`h-2 w-2 rounded-full ${notif.type === 'blocking' ? 'bg-red-500' : notif.type === 'urgent' ? 'bg-amber-500' : notif.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                        <span className="font-bold text-xs truncate max-w-[180px]">{notif.title}</span>
                        <span className="text-[10px] text-zinc-400 ml-auto shrink-0">{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 line-clamp-2">{notif.message}</p>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </div>
                ))
              )}
            </div>
            <DropdownMenuItem className="text-center justify-center text-xs text-emerald-600 font-bold py-2 cursor-pointer" onClick={() => navigate('/comunicacoes/mural')}>
              Ver todas as notificações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="ghost" size="icon" className="hidden sm:flex" onClick={() => navigate('/comunicacoes/chat')}>
          <MessageSquare className="h-5 w-5" />
        </Button>

        <Separator orientation="vertical" className="mx-1 md:mx-2 h-8 hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800">
              <Avatar className="h-full w-full">
                <AvatarImage src="https://github.com/shadcn.png" alt={displayUser?.name} />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">{displayUser?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold leading-none">{displayUser?.name || 'Usuário'}</p>
                <p className="text-[10px] leading-none text-zinc-500 uppercase tracking-wider mt-1">{displayUser?.role || 'Perfil'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-2">
                <User className="h-4 w-4" />
                <span>Meu Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <CreditCard className="h-4 w-4" />
                <span>Assinatura</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate('/configuracoes')}>
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-2">
                <Mail className="h-4 w-4" />
                <span>Suporte</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <HelpCircle className="h-4 w-4" />
                <span>Ajuda</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-rose-600 gap-2 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/20 cursor-pointer" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Sair do Sistema</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
