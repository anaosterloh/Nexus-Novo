import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import { usePermissionsContext } from '@/context/PermissionsContext';
import { Role, Permission } from '@/lib/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  Settings as SettingsIcon, 
  Users, 
  Lock, 
  Globe, 
  Bell, 
  Database,
  Save,
  Plus,
  Palette,
  Check,
  ShoppingCart,
  FileText,
  Building2,
  LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';
import { SystemParameters } from './SystemParameters';
import { UserList } from './UserList';
import { TabelaList } from './TabelaList';
import { SectorManagement } from './SectorManagement';

export function SettingsDashboard() {
  const { currentCompany } = useApp();
  const { can } = usePermissions();
  const { permissions, updatePermission } = usePermissionsContext();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('sales');

  if (!can('manage_users')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Lock className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-zinc-500 max-w-md">Você não tem permissão para acessar as configurações do sistema.</p>
        </div>
      </div>
    );
  }

  const themes = [
    { id: 'emerald', name: 'Esmeralda', color: 'bg-emerald-500' },
    { id: 'blue', name: 'Oceano', color: 'bg-blue-500' },
    { id: 'violet', name: 'Ametista', color: 'bg-violet-500' },
    { id: 'rose', name: 'Rubi', color: 'bg-rose-500' },
    { id: 'amber', name: 'Âmbar', color: 'bg-amber-500' },
    { id: 'zinc', name: 'Industrial', color: 'bg-zinc-800' },
  ] as const;

  const roles: { value: Role; label: string }[] = [
    { value: 'admin', label: 'Administrador' },
    { value: 'manager', label: 'Gerente' },
    { value: 'sales', label: 'Vendedor' },
    { value: 'tech', label: 'Técnico' },
    { value: 'stock', label: 'Estoquista' },
    { value: 'finance', label: 'Financeiro' },
  ];

  const permissionModules = [
    { name: 'Vendas', view: 'view_sales', edit: 'edit_sales', approve: 'approve_sales' },
    { name: 'Financeiro', view: 'view_financials', edit: 'edit_financials' },
    { name: 'Estoque', view: 'view_stock', edit: 'edit_stock' },
    { name: 'Produtos', view: 'view_products', create: 'create_products', edit: 'edit_products' },
    { name: 'Técnico', view: 'view_service_orders', edit: 'edit_service_orders' },
    { name: 'Fiscal', view: 'view_fiscal', edit: 'edit_fiscal' },
    { name: 'Clientes', view: 'view_customers', edit: 'edit_customers' },
    { name: 'Compras', view: 'view_purchase_orders', create: 'create_purchase_orders' },
  ];

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success('Configurações salvas com sucesso!');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h2>
        <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-white border dark:bg-zinc-900">
          <TabsTrigger value="general" className="gap-2">
            <SettingsIcon className="h-4 w-4" /> Geral
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" /> Aparência
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4" /> Permissões
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="sectors" className="gap-2">
            <LayoutGrid className="h-4 w-4" /> Setores
          </TabsTrigger>
          <TabsTrigger value="parameters" className="gap-2">
            <Database className="h-4 w-4" /> Parâmetros
          </TabsTrigger>
          <TabsTrigger value="tables" className="gap-2">
            <FileText className="h-4 w-4" /> Tabelas Auxiliares
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Globe className="h-4 w-4" /> Integrações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" /> Temas do Sistema
              </CardTitle>
              <CardDescription>Escolha a cor principal que será aplicada em todo o Nexus ERP.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      toast.success(`Tema ${t.name} aplicado!`);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:border-primary/50",
                      theme === t.id ? "border-primary bg-primary/5" : "border-transparent bg-zinc-50"
                    )}
                  >
                    <div className={cn("h-10 w-10 rounded-full shadow-sm flex items-center justify-center", t.color)}>
                      {theme === t.id && <Check className="h-5 w-5 text-white" />}
                    </div>
                    <span className="text-xs font-medium">{t.name}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Acessibilidade</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Tamanho da Fonte</Label>
                        <p className="text-xs text-zinc-500">Ajustar legibilidade do sistema.</p>
                      </div>
                      <Select defaultValue="medium">
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Pequeno</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="large">Grande</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Modo Compacto</Label>
                        <p className="text-xs text-zinc-500">Reduzir espaçamentos para maior densidade de dados.</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Interface</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Animações de Transição</Label>
                        <p className="text-xs text-zinc-500">Habilitar efeitos visuais entre telas.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Barra Lateral Retraída</Label>
                        <p className="text-xs text-zinc-500">Iniciar sistema com menu minimizado.</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>Configure os dados básicos da sua organização.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Fantasia</Label>
                  <Input defaultValue={currentCompany?.name} />
                </div>
                <div className="space-y-2">
                  <Label>Razão Social</Label>
                  <Input placeholder="Razão Social Completa" />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-2">
                  <Label>Inscrição Estadual</Label>
                  <Input placeholder="Isento" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Localização e Idioma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Fuso Horário Automático</Label>
                  <p className="text-xs text-zinc-500">Ajustar horário baseado na localização da filial.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Moeda Padrão (BRL)</Label>
                  <p className="text-xs text-zinc-500">Utilizar Real Brasileiro em todos os módulos financeiros.</p>
                </div>
                <Switch defaultChecked disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sectors" className="space-y-4">
          <SectorManagement />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Matriz de Permissões</CardTitle>
                  <CardDescription>Controle granular de acesso por setor e função.</CardDescription>
                </div>
                <div className="w-[200px]">
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as Role)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Acesso a Dados Sensíveis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-xl">
                      <div className="space-y-0.5">
                        <Label>Visualizar Custos de Compra</Label>
                        <p className="text-xs text-zinc-500">Apenas setores autorizados podem ver preços de custo.</p>
                      </div>
                      <Switch 
                        checked={permissions[selectedRole]?.includes('view_cost_price')}
                        onCheckedChange={(checked) => updatePermission(selectedRole, 'view_cost_price', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-xl">
                      <div className="space-y-0.5">
                        <Label>Visualizar Margem de Lucro</Label>
                        <p className="text-xs text-zinc-500">Restringir visualização de rentabilidade nos pedidos.</p>
                      </div>
                      <Switch 
                        checked={permissions[selectedRole]?.includes('view_financials')}
                        onCheckedChange={(checked) => updatePermission(selectedRole, 'view_financials', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Permissões por Módulo</h4>
                  <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-50 dark:bg-zinc-900">
                        <tr>
                          <th className="text-left p-4 font-bold">Módulo</th>
                          <th className="text-center p-4 font-bold">Visualizar</th>
                          <th className="text-center p-4 font-bold">Criar</th>
                          <th className="text-center p-4 font-bold">Editar</th>
                          <th className="text-center p-4 font-bold">Aprovar/Excluir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {permissionModules.map(module => (
                          <tr key={module.name} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                            <td className="p-4 font-medium">{module.name}</td>
                            <td className="p-4 text-center">
                              {module.view && (
                                <Switch 
                                  size="sm" 
                                  checked={permissions[selectedRole]?.includes(module.view as Permission)}
                                  onCheckedChange={(checked) => updatePermission(selectedRole, module.view as Permission, checked)}
                                />
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {module.create && (
                                <Switch 
                                  size="sm" 
                                  checked={permissions[selectedRole]?.includes(module.create as Permission)}
                                  onCheckedChange={(checked) => updatePermission(selectedRole, module.create as Permission, checked)}
                                />
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {module.edit && (
                                <Switch 
                                  size="sm" 
                                  checked={permissions[selectedRole]?.includes(module.edit as Permission)}
                                  onCheckedChange={(checked) => updatePermission(selectedRole, module.edit as Permission, checked)}
                                />
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {module.approve && (
                                <Switch 
                                  size="sm" 
                                  checked={permissions[selectedRole]?.includes(module.approve as Permission)}
                                  onCheckedChange={(checked) => updatePermission(selectedRole, module.approve as Permission, checked)}
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Usuários</CardTitle>
              <CardDescription>Gerencie os acessos e permissões dos colaboradores.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parameters" className="space-y-4">
          <SystemParameters />
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <TabelaList />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" /> Gerenciamento de APIs e Integrações
              </CardTitle>
              <CardDescription>Ative ou desative serviços externos para a empresa {currentCompany?.name}.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {[
                  { name: 'WhatsApp Webhook', desc: 'Envio automático de mensagens e notificações.', icon: Globe, status: true },
                  { name: 'Tray E-commerce', desc: 'Sincronização de pedidos e estoque com a loja virtual.', icon: ShoppingCart, status: false },
                  { name: 'Domínio Sistemas', desc: 'Exportação automática de XMLs para contabilidade.', icon: FileText, status: true },
                  { name: 'Itaú API Bancária', desc: 'Conciliação automática e emissão de boletos.', icon: Building2, status: true },
                  { name: 'Santander API', desc: 'Integração direta para pagamentos e recebimentos.', icon: Building2, status: false },
                ].map((api) => (
                  <div key={api.name} className="flex items-center justify-between p-4 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-white dark:bg-zinc-950 border flex items-center justify-center">
                        <api.icon className="h-5 w-5 text-zinc-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{api.name}</p>
                        <p className="text-xs text-zinc-500">{api.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={api.status ? "outline" : "secondary"} className={cn(
                        "text-[10px] font-bold",
                        api.status ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-400"
                      )}>
                        {api.status ? 'ATIVO' : 'INATIVO'}
                      </Badge>
                      <Switch defaultChecked={api.status} onCheckedChange={(checked) => {
                        toast.info(`${api.name} ${checked ? 'ativado' : 'desativado'} para esta empresa.`);
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
