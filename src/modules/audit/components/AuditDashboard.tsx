import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Download, 
  History, 
  User, 
  ShieldAlert, 
  Database,
  Eye,
  Calendar,
  Clock,
  ArrowRight,
  AlertCircle,
  Lock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ModuleStatusBadge } from '@/components/common/ModuleStatusBadge';

export function AuditDashboard({ defaultTab = 'logs' }: { defaultTab?: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetch('/api/audit/logs').then(r => r.json()).then(setLogs);
    fetch('/api/audit/security').then(r => r.json()).then(setSecurityEvents);
  }, []);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'info': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">INFO</Badge>;
      case 'warning': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">AVISO</Badge>;
      case 'critical': return <Badge variant="destructive">CRÍTICO</Badge>;
      default: return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">INFO</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Rastro de Auditoria</h2>
            <ModuleStatusBadge status="Visual" />
          </div>
          <p className="text-sm text-zinc-500 mt-1">Histórico completo de ações e modificações no sistema.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none gap-2 h-9 text-xs sm:text-sm">
            <Download className="h-4 w-4" /> Exportar Logs
          </Button>
          <Button variant="outline" className="flex-1 md:flex-none gap-2 h-9 text-xs sm:text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-none">
            <ShieldAlert className="h-4 w-4" /> Alertas
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Ações Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-[10px] text-emerald-600 mt-1">+12% vs ontem</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Alertas Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">3</div>
            <p className="text-[10px] text-zinc-400 mt-1">Requerem atenção imediata</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Usuários Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">18</div>
            <p className="text-[10px] text-zinc-400 mt-1">Conectados no momento</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs">Logs de Sistema</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="acessos">Controle de Acessos</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input 
                placeholder="Buscar por usuário, ação, módulo ou detalhes..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" /> Filtros
            </Button>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" /> Período
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs font-mono">
                        <div className="flex flex-col">
                          <span>{format(new Date(log.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          <span className="text-zinc-400">{format(new Date(log.created_at), 'HH:mm:ss')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold">
                            {(log.user_id || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{log.user_id}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">{log.module}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-sm">{log.action}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-xs text-zinc-500" title={log.description}>
                        {log.description}
                      </TableCell>
                      <TableCell>{getSeverityBadge('info')}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">Mostrando {logs.length} registros de auditoria.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Anterior</Button>
              <Button variant="outline" size="sm">Próximo</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card>
            <CardHeader>
              <CardTitle>Eventos de Segurança</CardTitle>
              <CardDescription>Monitoramento de logins, PINs e acessos negados.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityEvents.map((evt) => (
                    <TableRow key={evt.id}>
                      <TableCell className="text-xs font-mono">{format(new Date(evt.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                      <TableCell>{evt.user_id}</TableCell>
                      <TableCell><Badge variant="outline">{evt.event_type}</Badge></TableCell>
                      <TableCell className="text-xs text-zinc-500">{evt.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acessos">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Acessos</CardTitle>
              <CardDescription>Em construção: Este módulo ainda usa dados demonstrativos e será integrado ao sistema de permissões.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
