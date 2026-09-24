import { useEffect, useState } from 'react';
import { 
  Calculator, 
  Calendar, 
  CreditCard, 
  Settings, 
  Smile, 
  User,
  Search,
  FileText,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Wrench,
  Truck,
  ShieldCheck,
  LayoutDashboard,
  Plus
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useNavigate } from 'react-router-dom';

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Digite um comando ou pesquise..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Sugestões">
          <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard Principal</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/agenda'))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Agenda & Compromissos</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/comercial/pedidos'))}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Pedidos de Venda</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Cadastros">
          <CommandItem onSelect={() => runCommand(() => navigate('/cadastros/geral'))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Clientes & Fornecedores</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/cadastros/produtos'))}>
            <Package className="mr-2 h-4 w-4" />
            <span>Produtos & Serviços</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Financeiro">
          <CommandItem onSelect={() => runCommand(() => navigate('/financeiro/movimento'))}>
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Fluxo de Caixa</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/financeiro/pagar'))}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Contas a Pagar</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Ações Rápidas">
          <CommandItem onSelect={() => runCommand(() => console.log('Novo Pedido'))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Novo Pedido de Venda</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/configuracoes'))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações do Sistema</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
