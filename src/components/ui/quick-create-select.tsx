import { useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuickCreateSelectProps {
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  onCreate: (name: string) => void;
  value?: string;
}

export function QuickCreateSelect({ 
  label, 
  placeholder, 
  options, 
  onSelect, 
  onCreate,
  value 
}: QuickCreateSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName);
      setNewName('');
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onSelect}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400" />
                <Input 
                  placeholder="Buscar..." 
                  className="h-8 pl-7 text-xs" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {filteredOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
            {searchTerm && filteredOptions.length === 0 && (
              <div 
                className="p-2 text-xs text-zinc-500 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => {
                  setNewName(searchTerm);
                  setIsOpen(true);
                }}
              >
                Não localizado. Deseja criar novo: <span className="font-bold">"{searchTerm}"</span>?
              </div>
            )}
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="icon" 
          className="shrink-0"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo {label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome / Descrição</Label>
              <Input 
                placeholder={`Digite o nome do novo ${label.toLowerCase()}`}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
