import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, User, Lock, Bell, Building2, Layout, FileText, Wallet } from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  username: z.string().min(3, 'Usuário deve ter no mínimo 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
  role: z.string().min(1, 'Selecione um cargo'),
  sector: z.string().min(1, 'Selecione um setor'),
  status: z.boolean(),
  permissions: z.object({
    companies: z.array(z.string()),
    modules: z.object({
      sales: z.object({ view: z.boolean(), create: z.boolean(), edit: z.boolean(), approve: z.boolean() }),
      inventory: z.object({ view: z.boolean(), create: z.boolean(), edit: z.boolean(), approve: z.boolean() }),
      finance: z.object({ view: z.boolean(), create: z.boolean(), edit: z.boolean(), approve: z.boolean() }),
      technical: z.object({ view: z.boolean(), create: z.boolean(), edit: z.boolean(), approve: z.boolean() }),
      reports: z.object({ view: z.boolean(), create: z.boolean(), edit: z.boolean(), approve: z.boolean() }),
      settings: z.object({ view: z.boolean(), create: z.boolean(), edit: z.boolean(), approve: z.boolean() }),
    }),
    reports: z.array(z.string()),
    accounts: z.array(z.string()),
  }),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

export function UserForm({ initialData, onSuccess }: UserFormProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData ? {
      name: initialData.name || '',
      email: initialData.email || '',
      username: initialData.username || '',
      password: '',
      role: initialData.role || '',
      sector: initialData.sector || '',
      status: initialData.status === 'active',
      permissions: {
        companies: initialData.permissions?.companies || ['1'],
        modules: initialData.permissions?.modules || {
          sales: { view: true, create: false, edit: false, approve: false },
          inventory: { view: true, create: false, edit: false, approve: false },
          finance: { view: false, create: false, edit: false, approve: false },
          technical: { view: false, create: false, edit: false, approve: false },
          reports: { view: true, create: false, edit: false, approve: false },
          settings: { view: false, create: false, edit: false, approve: false },
        },
        reports: initialData.permissions?.reports || ['vendas_mensal', 'estoque_baixo'],
        accounts: initialData.permissions?.accounts || ['caixa_geral'],
      }
    } : {
      name: '',
      email: '',
      username: '',
      password: '',
      role: '',
      sector: '',
      status: true,
      permissions: {
        companies: ['1'],
        modules: {
          sales: { view: true, create: true, edit: true, approve: false },
          inventory: { view: true, create: true, edit: true, approve: false },
          finance: { view: false, create: false, edit: false, approve: false },
          technical: { view: false, create: false, edit: false, approve: false },
          reports: { view: true, create: false, edit: false, approve: false },
          settings: { view: false, create: false, edit: false, approve: false },
        },
        reports: [],
        accounts: [],
      },
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    try {
      console.log('User data:', data);
      toast.success(initialData ? 'Usuário atualizado!' : 'Usuário cadastrado!');
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao salvar usuário');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic" className="gap-2">
              <User className="h-4 w-4" /> Dados do Usuário
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Shield className="h-4 w-4" /> Permissões de Acesso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: João Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="joao@empresa.com.br" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Comercial">Comercial</SelectItem>
                        <SelectItem value="Financeiro">Financeiro</SelectItem>
                        <SelectItem value="Técnico">Técnico</SelectItem>
                        <SelectItem value="TI">TI / Suporte</SelectItem>
                        <SelectItem value="Logística">Logística</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo / Função</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        
                        // Auto-populate permissions based on role
                        const rolePermissions: Record<string, any> = {
                          'Administrador': {
                            sales: { view: true, create: true, edit: true, approve: true },
                            inventory: { view: true, create: true, edit: true, approve: true },
                            finance: { view: true, create: true, edit: true, approve: true },
                            technical: { view: true, create: true, edit: true, approve: true },
                            reports: { view: true, create: true, edit: true, approve: true },
                            settings: { view: true, create: true, edit: true, approve: true },
                          },
                          'Gerente': {
                            sales: { view: true, create: true, edit: true, approve: true },
                            inventory: { view: true, create: true, edit: true, approve: true },
                            finance: { view: true, create: true, edit: true, approve: true },
                            technical: { view: true, create: true, edit: true, approve: true },
                            reports: { view: true, create: true, edit: true, approve: false },
                            settings: { view: true, create: false, edit: false, approve: false },
                          },
                          'Vendedor': {
                            sales: { view: true, create: true, edit: true, approve: false },
                            inventory: { view: true, create: false, edit: false, approve: false },
                            finance: { view: false, create: false, edit: false, approve: false },
                            technical: { view: false, create: false, edit: false, approve: false },
                            reports: { view: false, create: false, edit: false, approve: false },
                            settings: { view: false, create: false, edit: false, approve: false },
                          },
                          'Técnico': {
                            sales: { view: false, create: false, edit: false, approve: false },
                            inventory: { view: true, create: false, edit: false, approve: false },
                            finance: { view: false, create: false, edit: false, approve: false },
                            technical: { view: true, create: true, edit: true, approve: false },
                            reports: { view: false, create: false, edit: false, approve: false },
                            settings: { view: false, create: false, edit: false, approve: false },
                          },
                          'Auxiliar': {
                            sales: { view: true, create: true, edit: false, approve: false },
                            inventory: { view: true, create: true, edit: false, approve: false },
                            finance: { view: false, create: false, edit: false, approve: false },
                            technical: { view: false, create: false, edit: false, approve: false },
                            reports: { view: false, create: false, edit: false, approve: false },
                            settings: { view: false, create: false, edit: false, approve: false },
                          }
                        };

                        if (rolePermissions[value]) {
                          form.setValue('permissions.modules', rolePermissions[value]);
                          toast.info(`Permissões atualizadas para o perfil: ${value}`);
                        }
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cargo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Administrador">Administrador</SelectItem>
                        <SelectItem value="Gerente">Gerente</SelectItem>
                        <SelectItem value="Vendedor">Vendedor</SelectItem>
                        <SelectItem value="Técnico">Técnico</SelectItem>
                        <SelectItem value="Auxiliar">Auxiliar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Usuário (Login)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: joao.silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{initialData ? 'Nova Senha (deixe em branco)' : 'Senha'}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Usuário Ativo</FormLabel>
                    <FormDescription>
                      Define se o usuário pode acessar o sistema.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4 pt-4">
            <Tabs defaultValue="screens" className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-zinc-100 dark:bg-zinc-800">
                <TabsTrigger value="companies" className="text-[10px] py-1 gap-1">
                  <Building2 className="h-3 w-3" /> Empresas
                </TabsTrigger>
                <TabsTrigger value="screens" className="text-[10px] py-1 gap-1">
                  <Layout className="h-3 w-3" /> Telas
                </TabsTrigger>
                <TabsTrigger value="reports" className="text-[10px] py-1 gap-1">
                  <FileText className="h-3 w-3" /> Relatórios
                </TabsTrigger>
                <TabsTrigger value="accounts" className="text-[10px] py-1 gap-1">
                  <Wallet className="h-3 w-3" /> Contas Caixa
                </TabsTrigger>
              </TabsList>

              <TabsContent value="companies" className="pt-4 space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded-md">
                        <span className="text-sm">Nexus Tecnologia LTDA</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded-md">
                        <span className="text-sm">Filial São Paulo</span>
                        <Switch />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="screens" className="pt-4 space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-100 dark:bg-zinc-800 border-b">
                          <tr>
                            <th className="px-4 py-3 font-medium">Módulo</th>
                            <th className="px-4 py-3 font-medium text-center">Visualizar</th>
                            <th className="px-4 py-3 font-medium text-center">Criar</th>
                            <th className="px-4 py-3 font-medium text-center">Editar</th>
                            <th className="px-4 py-3 font-medium text-center">Aprovar/Excluir</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {[
                            { id: 'sales', label: 'Vendas' },
                            { id: 'inventory', label: 'Estoque' },
                            { id: 'finance', label: 'Financeiro' },
                            { id: 'technical', label: 'Técnico' },
                            { id: 'reports', label: 'Relatórios' },
                            { id: 'settings', label: 'Configurações' },
                          ].map((module) => (
                            <tr key={module.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                              <td className="px-4 py-3 font-medium">{module.label}</td>
                              <td className="px-4 py-3 text-center">
                                <FormField
                                  control={form.control}
                                  name={`permissions.modules.${module.id}.view` as any}
                                  render={({ field }) => (
                                    <FormControl>
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                  )}
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <FormField
                                  control={form.control}
                                  name={`permissions.modules.${module.id}.create` as any}
                                  render={({ field }) => (
                                    <FormControl>
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                  )}
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <FormField
                                  control={form.control}
                                  name={`permissions.modules.${module.id}.edit` as any}
                                  render={({ field }) => (
                                    <FormControl>
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                  )}
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <FormField
                                  control={form.control}
                                  name={`permissions.modules.${module.id}.approve` as any}
                                  render={({ field }) => (
                                    <FormControl>
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                  )}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="pt-4 space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      {['Vendas Mensal', 'Posição de Estoque', 'Fluxo de Caixa', 'Comissões', 'Inadimplência'].map(report => (
                        <div key={report} className="flex items-center justify-between p-2 border rounded-md">
                          <span className="text-sm">{report}</span>
                          <Switch defaultChecked={report === 'Vendas Mensal'} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="accounts" className="pt-4 space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      {['Caixa Geral', 'Itaú Principal', 'Santander', 'Cofre'].map(account => (
                        <div key={account} className="flex items-center justify-between p-2 border rounded-md">
                          <span className="text-sm">{account}</span>
                          <Switch defaultChecked={account === 'Caixa Geral'} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto">
            {initialData ? 'Salvar Alterações' : 'Cadastrar Usuário'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
