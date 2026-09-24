import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Printer, Search, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  category: string;
}

interface DocumentPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  entityId: string;
  type: 'os' | 'order' | 'customer';
}

export function DocumentPrintModal({ open, onOpenChange, entityName, entityId, type }: DocumentPrintModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const templates: Template[] = [
    { id: '1', name: 'Laudo Técnico de Manutenção', category: 'Técnica' },
    { id: '2', name: 'Termo de Entrega de Equipamento', category: 'Logística' },
    { id: '3', name: 'Relatório de Peças Trocadas', category: 'Técnica' },
    { id: '4', name: 'Checklist de Saída', category: 'Técnica' },
    { id: '5', name: 'Proposta de Extensão de Garantia', category: 'Comercial' },
  ].filter(t => {
    if (type === 'os') return t.category === 'Técnica' || t.category === 'Logística';
    return true;
  });

  const handlePrint = () => {
    if (!selectedTemplateId) return;
    toast.success('Gerando documento para impressão...');
    onOpenChange(false);
    // In a real app, this would redirect to the generator with pre-filled data
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-blue-600" />
            Imprimir Documento
          </DialogTitle>
          <DialogDescription>
            Selecione um modelo para gerar o documento de <strong>{entityId}</strong> ({entityName}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input 
              placeholder="Buscar modelos..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {templates.map((template) => (
              <div 
                key={template.id}
                onClick={() => setSelectedTemplateId(template.id)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:border-blue-500 group",
                  selectedTemplateId === template.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : "border-zinc-200 dark:border-zinc-800"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded flex items-center justify-center",
                    selectedTemplateId === template.id ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  )}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{template.name}</p>
                    <Badge variant="outline" className="text-[10px] h-4">{template.category}</Badge>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-1",
                  selectedTemplateId === template.id && "text-blue-500"
                )} />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            disabled={!selectedTemplateId}
            onClick={handlePrint}
          >
            Gerar e Visualizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
