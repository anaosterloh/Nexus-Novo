import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertCircle, ShieldAlert, CheckCircle2, Info, Clock, Archive, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { NotificationItem, NotificationSummary } from './types';
import { notificationService } from './notificationService';
import { useAuth } from '@/context/AuthContext';

import { useApp } from '@/context/AppContext';

export function NotificationCenter() {
  const { user } = useAuth();
  const { currentCompany } = useApp();
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [responseText, setResponseText] = useState('');

  const loadData = async () => {
    if (!currentCompany || !user) return;
    try {
      setLoading(true);
      const params = {
        companyId: currentCompany.id,
        userId: user.id,
        role: user.role,
        department: (user as any).department || 'admin'
      };
      
      const [notifs, sum] = await Promise.all([
        notificationService.listNotifications(params),
        notificationService.getNotificationSummary(params)
      ]);
      
      setNotifications(notifs);
      setSummary(sum);
    } catch (error) {
      toast.error("Falha ao carregar notificações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentCompany, user]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      await loadData();
    } catch (error) {
      toast.error("Falha ao marcar como lida");
    }
  };

  const handleMarkAsUnread = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsUnread(id);
      await loadData();
    } catch (error) {
      toast.error("Falha ao marcar como não lida");
    }
  };

  const handleArchive = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentCompany) return;
    try {
      await notificationService.archiveNotification(id, currentCompany.id);
      toast.success("Notificação arquivada com sucesso");
      await loadData();
    } catch (error) {
      toast.error("Falha ao arquivar");
    }
  };

  const handleResolve = async () => {
    if (!selectedNotif || !currentCompany) return;
    try {
      await notificationService.resolveNotification(selectedNotif.id, responseText, currentCompany.id);
      toast.success("Notificação resolvida com sucesso");
      setSelectedNotif(null);
      setResponseText('');
      await loadData();
    } catch (error) {
      toast.error("Falha ao resolver");
    }
  };

  const handleSnooze = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      // Snooze for 1 hour
      const d = new Date();
      d.setHours(d.getHours() + 1);
      
      await notificationService.snoozeNotification(id, d.toISOString());
      toast.success("Notificação adiada por 1 hora");
      if (selectedNotif?.id === id) setSelectedNotif(null);
      await loadData();
    } catch (error) {
      toast.error("Falha ao adiar");
    }
  };

  const openNotif = (n: NotificationItem) => {
    setSelectedNotif(n);
    if (n.status === 'unread') {
      handleMarkAsRead(n.id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'blocking': return <ShieldAlert className="h-5 w-5 text-rose-600" />;
      case 'urgent': return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'blocking': return 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800';
      case 'urgent': return 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800';
      default: return 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800';
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'unread') return n.status === 'unread';
    if (filter === 'urgent') return n.type === 'urgent' || n.type === 'blocking';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mural de Notificações</h1>
          <p className="text-zinc-500">Avisos e pendências do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Ativas</SelectItem>
              <SelectItem value="unread">Não Lidas</SelectItem>
              <SelectItem value="urgent">Urgentes/Bloqueantes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
              <Bell className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.unread}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.urgent}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bloqueantes</CardTitle>
              <ShieldAlert className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.blocking}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Adiados</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.snoozed}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolvidos Hoje</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.resolvedToday}</div>
            </CardContent>
          </Card>
        </div>
      )}


      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Carregando notificações...</div>
          ) : filteredNotifs.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">Nenhuma notificação encontrada com os filtros atuais.</div>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filteredNotifs.map(notif => (
                <div 
                  key={notif.id} 
                  className={`p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer flex gap-4 ${notif.status === 'unread' ? 'bg-zinc-50/50 dark:bg-zinc-800/30 font-medium' : ''}`}
                  onClick={() => openNotif(notif)}
                >
                  <div className="mt-1 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-semibold">{notif.title}</p>
                      <span className="text-xs text-zinc-500">
                        {format(new Date(notif.created_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-1">{notif.message}</p>
                    <div className="flex items-center gap-2 pt-2">
                      <Badge variant="secondary" className="text-[10px] uppercase">{notif.source_module || 'Sistema'}</Badge>
                      {notif.status === 'unread' && <Badge className="bg-blue-500 text-[10px] uppercase text-white hover:bg-blue-600">Nova</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 shadow-none" onClick={(e) => handleArchive(notif.id, e)}>
                      <Archive className="h-4 w-4 text-zinc-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedNotif && (
        <Dialog open={!!selectedNotif} onOpenChange={(open) => !open && setSelectedNotif(null)}>
          <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto dark:bg-zinc-950 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 dark:text-zinc-100">
                {getIcon(selectedNotif.type)}
                {selectedNotif.title}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                 Notificação recebida em {format(new Date(selectedNotif.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className={`p-4 rounded-lg border ${getColor(selectedNotif.type)}`}>
                <p className="text-sm">{selectedNotif.message}</p>
              </div>

              {selectedNotif.requires_response ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Resposta / Resolução Obrigatória</label>
                  <Textarea 
                    placeholder="Descreva a ação tomada..." 
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                  />
                </div>
              ) : null}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => handleSnooze(selectedNotif.id)}>
                <Clock className="h-4 w-4 mr-2" />
                Adiar 1h
              </Button>
              {selectedNotif.requires_response ? (
                <Button onClick={handleResolve} disabled={!responseText.trim()}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Resolver
                </Button>
              ) : (
                <Button variant="default" onClick={() => { handleArchive(selectedNotif.id); setSelectedNotif(null); }}>
                  <Archive className="h-4 w-4 mr-2" />
                  Arquivar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
