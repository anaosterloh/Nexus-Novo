import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ShieldAlert, Shield, Users, Lock, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionType, setActionType] = useState<string>('');
  const [reason, setReason] = useState('');
  const [endSessions, setEndSessions] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tempPin, setTempPin] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      toast.error('Erro ao buscar usuários');
    }
    setLoading(false);
  };

  const openDialog = (user: any, action: string) => {
    setSelectedUser(user);
    setActionType(action);
    setReason('');
    setEndSessions(action === 'block');
    setTempPin(null);
    setDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    try {
      if (actionType === 'block' || actionType === 'unblock') {
        const newStatus = actionType === 'block' ? 'blocked' : 'active';
        await fetch('/api/users/' + selectedUser.id + '/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, reason, endActiveSessions: endSessions, updated_by: 'admin' })
        });
        toast.success('Usuário ' + (newStatus === 'blocked' ? 'bloqueado' : 'desbloqueado'));
      } else if (actionType === 'reset_pin') {
        const res = await fetch('/api/users/' + selectedUser.id + '/reset-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updated_by: 'admin' })
        });
        const data = await res.json();
        setTempPin(data.tempPin);
        toast.success('PIN resetado com sucesso');
        fetchUsers();
        return; // dont close dialog yet
      } else if (actionType === 'end_sessions') {
        await fetch('/api/users/' + selectedUser.id + '/end-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updated_by: 'admin' })
        });
        toast.success('Sessões encerradas');
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (e) {
      toast.error('Erro ao executar ação');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Segurança e Usuários</h1>
          <p className="text-zinc-500">Gerencie acessos, segurança e permissões do sistema.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Lista de usuários do Nexus ERP</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md divide-y">
            {users.map(u => (
              <div key={u.id} className="p-4 flex items-center justify-between hover:bg-zinc-50">
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-sm text-zinc-500">{u.email} • Nível: {u.role}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={'px-2 py-1 text-xs rounded-full ' + (u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                    {u.status === 'active' ? 'Ativo' : 'Bloqueado'}
                  </span>
                  
                  <Button variant="outline" size="sm" onClick={() => openDialog(u, 'reset_pin')}>
                    <Lock className="w-4 h-4 mr-2" />
                    Resetar PIN
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openDialog(u, 'end_sessions')}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Encerrar Sessões
                  </Button>
                  
                  {u.status === 'active' ? (
                    <Button variant="destructive" size="sm" onClick={() => openDialog(u, 'block')}>
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      Bloquear
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => openDialog(u, 'unblock')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Desbloquear
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && !loading && (
              <div className="p-4 text-center text-zinc-500">Nenhum usuário encontrado.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'block' && 'Bloquear Usuário'}
              {actionType === 'unblock' && 'Desbloquear Usuário'}
              {actionType === 'reset_pin' && (tempPin ? 'PIN Resetado' : 'Resetar PIN')}
              {actionType === 'end_sessions' && 'Encerrar Sessões'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'block' && ('Tem certeza que deseja bloquear ' + selectedUser?.name + '? O usuário perderá o acesso imediatamente.')}
              {actionType === 'unblock' && ('Tem certeza que deseja desbloquear ' + selectedUser?.name + '?')}
              {actionType === 'reset_pin' && !tempPin && ('Tem certeza que deseja gerar um novo PIN temporário para ' + selectedUser?.name + '?')}
              {actionType === 'reset_pin' && tempPin && 'Novo PIN temporário gerado.'}
              {actionType === 'end_sessions' && ('Forçar o logout de ' + selectedUser?.name + ' em todos os dispositivos?')}
            </DialogDescription>
          </DialogHeader>

          {!tempPin && (
            <div className="space-y-4 py-4">
              {(actionType === 'block') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Motivo do bloqueio</label>
                  <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Descreva o motivo..." />
                </div>
              )}
              {actionType === 'block' && (
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="end-sessions" checked={endSessions} onChange={e => setEndSessions(e.target.checked)} />
                  <label htmlFor="end-sessions" className="text-sm">Também encerrar todas as sessões ativas imediatamente</label>
                </div>
              )}
            </div>
          )}

          {tempPin && (
            <div className="bg-zinc-100 p-6 rounded-md text-center">
              <div className="text-sm text-zinc-500 mb-2">PIN Temporário</div>
              <div className="text-4xl font-mono tracking-widest font-bold">{tempPin}</div>
              <div className="text-sm text-red-500 mt-2">Copie agora. Ele não será exibido novamente.</div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Fechar</Button>
            {!tempPin && (
              <Button 
                variant={actionType === 'block' ? 'destructive' : 'default'} 
                onClick={handleConfirmAction}
              >
                Confirmar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
