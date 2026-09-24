import { Moon, Sun, Monitor, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/context/ThemeContext';

export function ThemeSwitcher() {
  const { theme, setTheme, colorMode, setColorMode } = useTheme();

  const themes = [
    { id: 'emerald', label: 'Esmeralda', color: 'bg-emerald-500' },
    { id: 'blue', label: 'Azul', color: 'bg-blue-500' },
    { id: 'violet', label: 'Violeta', color: 'bg-violet-500' },
    { id: 'rose', label: 'Rosa', color: 'bg-rose-500' },
    { id: 'amber', label: 'Âmbar', color: 'bg-amber-500' },
    { id: 'zinc', label: 'Zinco', color: 'bg-zinc-500' },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Aparência">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Aparência do Sistema</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            {colorMode === 'light' && <Sun className="h-4 w-4" />}
            {colorMode === 'dark' && <Moon className="h-4 w-4" />}
            {colorMode === 'system' && <Monitor className="h-4 w-4" />}
            <span>Modo de Cor</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setColorMode('light')} className="gap-2">
                <Sun className="h-4 w-4" /> Claro
                {colorMode === 'light' && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setColorMode('dark')} className="gap-2">
                <Moon className="h-4 w-4" /> Escuro
                {colorMode === 'dark' && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setColorMode('system')} className="gap-2">
                <Monitor className="h-4 w-4" /> Sistema
                {colorMode === 'system' && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        
        <div className="p-2">
          <p className="text-xs font-medium text-zinc-500 mb-2 px-2">Cor Principal</p>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                  theme === t.id ? 'bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-300 dark:ring-zinc-700' : ''
                }`}
              >
                <div className={`h-4 w-4 rounded-full ${t.color}`} />
                <span className="text-[10px] font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
