import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Filter, X, Check } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

export interface SearchField {
  label: string;
  key: string;
  type?: 'text' | 'number' | 'date' | 'select';
  options?: { label: string; value: string }[];
}

interface AdvancedSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  fields: SearchField[];
  onSearch: (criteria: any) => void;
}

export function AdvancedSearchModal({ 
  open, 
  onOpenChange, 
  title = "Pesquisa Avançada", 
  fields, 
  onSearch 
}: AdvancedSearchModalProps) {
  const [selectedField, setSelectedField] = useState<string>(fields[0]?.key || '');
  const [operator, setOperator] = useState<string>('contains');
  const [searchValue, setSearchValue] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<any[]>([]);

  const handleAddFilter = () => {
    if (!searchValue && operator !== 'empty' && operator !== 'not_empty') return;

    const field = fields.find(f => f.key === selectedField);
    if (!field) return;

    const newFilter = {
      id: Date.now(),
      field: field.key,
      fieldLabel: field.label,
      operator,
      value: searchValue
    };

    setActiveFilters([...activeFilters, newFilter]);
    setSearchValue('');
  };

  const handleRemoveFilter = (id: number) => {
    setActiveFilters(activeFilters.filter(f => f.id !== id));
  };

  const handleSearch = () => {
    // Convert filters to a criteria object or just pass the array
    // For simplicity, we'll pass the array of filters
    onSearch(activeFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    setActiveFilters([]);
    setSearchValue('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 bg-zinc-50 dark:bg-zinc-900 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-zinc-500" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-500 uppercase">Campo</Label>
              <div className="border rounded-md h-[120px] overflow-y-auto p-1 bg-white dark:bg-zinc-950">
                {fields.map((field) => (
                  <div 
                    key={field.key}
                    onClick={() => setSelectedField(field.key)}
                    className={`
                      px-2 py-1.5 text-sm rounded cursor-pointer flex items-center justify-between
                      ${selectedField === field.key 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 font-medium' 
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600'}
                    `}
                  >
                    {field.label}
                    {selectedField === field.key && <Check className="h-3 w-3" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-500 uppercase">Operador</Label>
              <RadioGroup value={operator} onValueChange={setOperator} className="space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="contains" id="contains" />
                  <Label htmlFor="contains" className="font-normal text-sm">Contém</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="equals" id="equals" />
                  <Label htmlFor="equals" className="font-normal text-sm">Igual a (=)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="greater" id="greater" />
                  <Label htmlFor="greater" className="font-normal text-sm">Maior que ({'>'})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="less" id="less" />
                  <Label htmlFor="less" className="font-normal text-sm">Menor que ({'<'})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="between" id="between" />
                  <Label htmlFor="between" className="font-normal text-sm">Entre</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-500 uppercase">Valor da Pesquisa</Label>
            <div className="flex gap-2">
              <Input 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Digite o termo..."
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddFilter()}
              />
              <Button onClick={handleAddFilter} variant="secondary" className="shrink-0">
                <Filter className="h-4 w-4 mr-2" /> Adicionar
              </Button>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="pt-2 border-t">
              <Label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Filtros Ativos</Label>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <Badge key={filter.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-100">
                    <span className="font-bold">{filter.fieldLabel}</span>
                    <span className="text-zinc-400 mx-1">•</span>
                    <span>{filter.operator === 'contains' ? 'contém' : filter.operator}</span>
                    <span className="text-zinc-400 mx-1">•</span>
                    <span className="font-mono font-bold">"{filter.value}"</span>
                    <button onClick={() => handleRemoveFilter(filter.id)} className="ml-1 hover:bg-blue-100 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t flex justify-between sm:justify-between">
          <Button variant="ghost" onClick={handleClear} disabled={activeFilters.length === 0}>
            Limpar Filtros
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4 mr-2" /> Pesquisar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
