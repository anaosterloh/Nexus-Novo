import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

interface PinConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionKey: string;
  actionGroup?: string;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export const PinConfirmDialog: React.FC<PinConfirmDialogProps> = ({
  open, onOpenChange, actionKey, actionGroup, onConfirm, title, description
}) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          companyId: user.company_id,
          pin,
          actionKey,
          actionGroup
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success('Ação autorizada.');
        setPin('');
        onOpenChange(false);
        onConfirm();
      } else {
        toast.error(data.error || 'PIN Incorreto');
        setPin('');
      }
    } catch (e) {
      toast.error('Erro de validação');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-zinc-900" />
            {title || 'Confirmação de Segurança'}
          </DialogTitle>
          <DialogDescription>
            {description || 'Esta ação é crítica e exige sua confirmação por PIN.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleVerify}>
          <div className="py-6">
            <div className="flex justify-center">
              <Input
                type="password"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-32 text-center text-xl tracking-widest"
                maxLength={8}
                required
                autoFocus
                autoComplete="off"
              />
            </div>
            <div className="text-center text-sm text-zinc-500 mt-4">
              Informe seu PIN pessoal para continuar.
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !pin}>
              {loading ? 'Verificando...' : 'Autorizar Ação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
