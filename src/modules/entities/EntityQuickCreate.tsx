import React, { useState } from 'react';
import { EntityRole } from './types';
import { entityService } from './entityService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EntitySuggestions } from './EntitySuggestions';

type EntityQuickCreateProps = {
  defaultRole?: EntityRole;
  onClose: () => void;
  onSave: () => void;
};

export const EntityQuickCreate: React.FC<EntityQuickCreateProps> = ({ defaultRole, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allowCreate, setAllowCreate] = useState(true);

  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!allowCreate) return setError('Resolva a possível duplicidade antes de continuar.');

    setError(null);
    setLoading(true);

    try {
      await entityService.createEntity({
        display_name: name,
        legal_name: name, // Fast fill
        document: document || '',
        email: email || '',
        phone: phone || '',
        roles: defaultRole ? [defaultRole] : ['customer'],
        quick_register: true,
        // Backend handles status, etc for quick_register=true via isQuick logic
      });
      onSave();
    } catch (err: any) {
      if (err.isConflict) {
        setError(`Duplicidade Encontrada: ${err.message}`);
      } else {
        setError(err.message || 'Erro ao criar pré-cadastro.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Pré-cadastro Rápido
          </DialogTitle>
          <DialogDescription>
            Criação rápida com dados mínimos. O cadastro ficará com status Temporário e Pendente de Revisão.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome (Exibição / Razão Social) <span className="text-red-500">*</span></label>
            <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Como buscar no sistema?" autoFocus />
            <EntitySuggestions 
              query={name} 
              onSelectExisting={(id) => {
                // Here we could tell the user we opened it or select and link it.
                // For simplicity, just close this and they can find it in the list.
                onClose();
              }}
              onAllowCreate={setAllowCreate}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Documento (Opcional)</label>
            <Input value={document} onChange={e => setDocument(e.target.value)} placeholder="Apenas para busca rápida se tiver..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail (Opc. )</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone (Opc.)</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded text-sm text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 mt-4">
            <strong className="block mb-1">Atenção</strong>
            O papel padrão será <strong>{defaultRole === 'supplier' ? 'Fornecedor' : defaultRole === 'carrier' ? 'Transportadora' : 'Cliente'}</strong>.
            Você precisará completar os dados financeiros/documentais depois.
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading || (!allowCreate && name.length >= 3)}>
              Criar Pré-cadastro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
