import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Settings, 
  DollarSign, 
  FileText, 
  ShoppingCart, 
  Package, 
  MessageSquare,
  Building2,
  Image as ImageIcon,
  Mail,
  Lock,
  Percent,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { settingsService } from '@/services/settingsService';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';

export function SystemParameters() {
  const { user } = useAuth();
  const { currentCompany } = useApp();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [config, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentCompany?.id) {
      loadParameters();
    }
  }, [currentCompany?.id]);

  const loadParameters = async () => {
    setFetching(true);
    try {
      const data = await settingsService.getParameters(currentCompany!.id);
      const configMap: Record<string, string> = {};
      data.forEach(p => {
        configMap[p.key] = p.value;
      });
      setConfig(configMap);
    } catch (error) {
      console.error('Error loading parameters:', error);
      toast.error('Erro ao carregar parâmetros');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (key: string, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      [key]: String(value)
    }));
  };

  const handleSave = async () => {
    if (!currentCompany?.id) return;
    
    setLoading(true);
    try {
      const paramsToUpdate = Object.entries(config).map(([key, value]) => ({
        key,
        value,
        category: getCategory(key)
      }));
      
      await settingsService.bulkUpdateParameters(currentCompany.id, paramsToUpdate, user?.id);
      toast.success('Parâmetros salvos com sucesso!');
    } catch (error) {
      console.error('Error saving parameters:', error);
      toast.error('Erro ao salvar parâmetros');
    } finally {
      setLoading(false);
    }
  };

  const getCategory = (key: string): string => {
    if (key.startsWith('finance_')) return 'financeiro';
    if (key.startsWith('sales_')) return 'vendas';
    if (key.startsWith('inventory_')) return 'compras';
    if (key.startsWith('mail_')) return 'comunicacao';
    if (key.startsWith('msg_')) return 'comunicacao';
    if (key.startsWith('tax_')) return 'fiscais';
    return 'geral';
  };

  if (fetching) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-zinc-500 animate-pulse">Carregando parâmetros do sistema...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Parâmetros do Sistema</h2>
          <p className="text-muted-foreground">Configure as regras de negócio e integrações globais.</p>
        </div>
        <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {loading ? 'Salvando...' : 'Salvar Parâmetros'}
        </Button>
      </div>

      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList className="bg-white border dark:bg-zinc-900 w-full justify-start overflow-x-auto">
          <TabsTrigger value="geral" className="gap-2">
            <Settings className="h-4 w-4" /> Gerais
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-2">
            <DollarSign className="h-4 w-4" /> Financeiro
          </TabsTrigger>
          <TabsTrigger value="fiscais" className="gap-2">
            <FileText className="h-4 w-4" /> Fiscais
          </TabsTrigger>
          <TabsTrigger value="vendas" className="gap-2">
            <ShoppingCart className="h-4 w-4" /> Vendas
          </TabsTrigger>
          <TabsTrigger value="compras" className="gap-2">
            <Package className="h-4 w-4" /> Compras/Entradas
          </TabsTrigger>
          <TabsTrigger value="comunicacao" className="gap-2">
            <MessageSquare className="h-4 w-4" /> Comunicação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-500" /> Identidade Visual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
                  <ImageIcon className="h-12 w-12 text-zinc-300 mb-2" />
                  <p className="text-xs text-zinc-500 text-center mb-4">Logo da Empresa (PNG/JPG)</p>
                  <Button variant="outline" size="sm">Selecionar Imagem</Button>
                </div>
                <div className="space-y-2">
                  <Label>Nome do Sistema Personalizado</Label>
                  <Input 
                    placeholder="Ex: Nexus ERP - Minha Empresa" 
                    value={config.system_name || ''} 
                    onChange={(e) => handleChange('system_name', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-500" /> Configurações de E-mail (SMTP)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Servidor SMTP</Label>
                    <Input 
                      placeholder="smtp.gmail.com" 
                      value={config.mail_smtp_server || ''} 
                      onChange={(e) => handleChange('mail_smtp_server', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Porta</Label>
                    <Input 
                      placeholder="587" 
                      value={config.mail_smtp_port || ''} 
                      onChange={(e) => handleChange('mail_smtp_port', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>E-mail de Envio</Label>
                  <Input 
                    placeholder="contato@empresa.com.br" 
                    value={config.mail_user || ''} 
                    onChange={(e) => handleChange('mail_user', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Senha / App Password</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={config.mail_pass || ''} 
                    onChange={(e) => handleChange('mail_pass', e.target.value)}
                    disabled
                  />
                  <p className="text-[10px] text-zinc-500 text-amber-600">⚠️ Por segurança, credenciais reais não são persistidas nesta fase pré-integração.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="use-ssl" 
                    checked={config.mail_use_ssl === 'true'} 
                    onCheckedChange={(val) => handleChange('mail_use_ssl', val)}
                  />
                  <Label htmlFor="use-ssl">Usar SSL/TLS</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Segurança e Acesso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <div className="space-y-0.5">
                  <Label>Autenticação em Duas Etapas (2FA)</Label>
                  <p className="text-xs text-zinc-500">Exigir código de verificação para todos os usuários.</p>
                </div>
                <Switch 
                  checked={config.security_2fa_enabled === 'true'} 
                  onCheckedChange={(val) => handleChange('security_2fa_enabled', val)}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <div className="space-y-0.5">
                  <Label>Tempo de Expiração da Sessão (minutos)</Label>
                  <p className="text-xs text-zinc-500">Deslogar automaticamente após inatividade.</p>
                </div>
                <Input 
                  className="w-20" 
                  type="number" 
                  value={config.session_timeout || '60'} 
                  onChange={(e) => handleChange('session_timeout', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Regras Financeiras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Juros de Mora Mensal (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={config.finance_interest_rate || '1.00'} 
                    onChange={(e) => handleChange('finance_interest_rate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Multa por Atraso (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={config.finance_late_fee || '2.00'} 
                    onChange={(e) => handleChange('finance_late_fee', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dias de Carência para Multa</Label>
                  <Input 
                    type="number" 
                    value={config.finance_grace_period || '0'} 
                    onChange={(e) => handleChange('finance_grace_period', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Contas Padrão</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Conta para Recebimentos</Label>
                    <Select 
                      value={config.finance_default_receive_account || 'itau'} 
                      onValueChange={(val) => handleChange('finance_default_receive_account', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a conta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="itau">Itaú - Ag: 1234 CC: 56789-0</SelectItem>
                        <SelectItem value="bradesco">Bradesco - Ag: 4321 CC: 98765-4</SelectItem>
                        <SelectItem value="caixa">Caixa Interno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Conta para Pagamentos</Label>
                    <Select 
                      value={config.finance_default_pay_account || 'caixa'} 
                      onValueChange={(val) => handleChange('finance_default_pay_account', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a conta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="itau">Itaú - Ag: 1234 CC: 56789-0</SelectItem>
                        <SelectItem value="caixa">Caixa Interno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Gerar Boletos Automaticamente</Label>
                    <p className="text-xs text-zinc-500">Emitir boleto ao confirmar faturamento de pedido.</p>
                  </div>
                  <Switch 
                    checked={config.finance_auto_billing === 'true'} 
                    onCheckedChange={(val) => handleChange('finance_auto_billing', val)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Bloquear Clientes Inadimplentes</Label>
                    <p className="text-xs text-zinc-500">Impedir novas vendas para clientes com títulos vencidos.</p>
                  </div>
                  <Switch 
                    checked={config.finance_block_delinquents === 'true'} 
                    onCheckedChange={(val) => handleChange('finance_block_delinquents', val)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscais" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Configurações Fiscais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Regime Tributário</Label>
                  <Select 
                    value={config.tax_regime || '1'} 
                    onValueChange={(val) => handleChange('tax_regime', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o regime" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Simples Nacional</SelectItem>
                      <SelectItem value="2">Simples Nacional - Excesso de Sublimite</SelectItem>
                      <SelectItem value="3">Regime Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ambiente de Emissão</Label>
                  <Select 
                    value={config.tax_environment || 'homologacao'} 
                    onValueChange={(val) => handleChange('tax_environment', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ambiente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homologacao">Homologação (Testes)</SelectItem>
                      <SelectItem value="producao">Produção (Real)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CFOP Padrão (Dentro do Estado)</Label>
                  <Input 
                    value={config.tax_default_cfop_internal || '5102'} 
                    onChange={(e) => handleChange('tax_default_cfop_internal', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CFOP Padrão (Fora do Estado)</Label>
                  <Input 
                    value={config.tax_default_cfop_external || '6102'} 
                    onChange={(e) => handleChange('tax_default_cfop_external', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Série NF-e</Label>
                  <Input 
                    value={config.tax_nfe_series || '1'} 
                    onChange={(e) => handleChange('tax_nfe_series', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-xl bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Certificado Digital</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">Vencimento: {config.tax_cert_expiry || '15/12/2026'}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">Atualizar Certificado</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Configurações de Vendas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Desconto Máximo Permitido (%)</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={config.sales_max_discount || '10.00'} 
                      onChange={(e) => handleChange('sales_max_discount', e.target.value)}
                      className="pr-8" 
                    />
                    <Percent className="absolute right-3 top-2.5 h-4 w-4 text-zinc-400" />
                  </div>
                  <p className="text-[10px] text-zinc-500">Vendedores não podem exceder este limite sem autorização.</p>
                </div>
                <div className="space-y-2">
                  <Label>Validade Padrão de Orçamentos (dias)</Label>
                  <Input 
                    type="number" 
                    value={config.sales_quote_validity || '7'} 
                    onChange={(e) => handleChange('sales_quote_validity', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Exigir Vendedor no Pedido</Label>
                    <p className="text-xs text-zinc-500">Torna o campo vendedor obrigatório em todos os lançamentos.</p>
                  </div>
                  <Switch 
                    checked={config.sales_require_seller === 'true'} 
                    onCheckedChange={(val) => handleChange('sales_require_seller', val)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Permitir Venda com Estoque Negativo</Label>
                    <p className="text-xs text-zinc-500">Permite confirmar pedidos mesmo sem saldo em estoque.</p>
                  </div>
                  <Switch 
                    checked={config.sales_allow_negative_stock === 'true'} 
                    onCheckedChange={(val) => handleChange('sales_allow_negative_stock', val)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Reserva de Estoque no Orçamento</Label>
                    <p className="text-xs text-zinc-500">Bloqueia o saldo do produto assim que o orçamento é criado.</p>
                  </div>
                  <Switch 
                    checked={config.sales_reserve_on_quote === 'true'} 
                    onCheckedChange={(val) => handleChange('sales_reserve_on_quote', val)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Observações Padrão nos Pedidos</Label>
                <textarea 
                  className="w-full min-h-[100px] p-3 rounded-md border bg-transparent text-sm"
                  placeholder="Texto que aparecerá automaticamente no campo observações dos novos pedidos..."
                  value={config.sales_default_notes || ''}
                  onChange={(e) => handleChange('sales_default_notes', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compras" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Parâmetros de Compras e Entradas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Manifestação Automática de NF-e</Label>
                    <p className="text-xs text-zinc-500">Realizar ciência da operação automaticamente ao receber XML.</p>
                  </div>
                  <Switch 
                    checked={config.purchase_auto_manifest === 'true'} 
                    onCheckedChange={(val) => handleChange('purchase_auto_manifest', val)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Atualizar Preço de Custo na Entrada</Label>
                    <p className="text-xs text-zinc-500">Atualiza o custo médio do produto baseado na última compra.</p>
                  </div>
                  <Switch 
                    checked={config.inventory_update_cost_on_entry === 'true'} 
                    onCheckedChange={(val) => handleChange('inventory_update_cost_on_entry', val)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Exigir Pedido de Compra na Entrada</Label>
                    <p className="text-xs text-zinc-500">Impede o lançamento de NF-e sem um pedido de compra vinculado.</p>
                  </div>
                  <Switch 
                    checked={config.purchase_require_order === 'true'} 
                    onCheckedChange={(val) => handleChange('purchase_require_order', val)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Margem de Lucro Padrão para Novos Produtos (%)</Label>
                <Input 
                  type="number" 
                  value={config.inventory_default_margin || '30'} 
                  onChange={(e) => handleChange('inventory_default_margin', e.target.value)}
                  className="w-32" 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comunicacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Integração Mensagens (A3)</CardTitle>
              <CardDescription>Configure o envio de mensagens via WhatsApp e SMS.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>API Key / Token</Label>
                    <Input 
                      type="password" 
                      value={config.msg_token || ''} 
                      onChange={(e) => handleChange('msg_token', e.target.value)}
                      disabled
                    />
                    <p className="text-[10px] text-zinc-500 text-amber-600">⚠️ Por segurança, tokens reais não são persistidos nesta etapa pre-integração.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Instância / Device ID</Label>
                    <Input 
                      placeholder="NEXUS-01" 
                      value={config.msg_instance_id || ''} 
                      onChange={(e) => handleChange('msg_instance_id', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 border rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Status: Conectado</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">Sua instância está pronta para enviar mensagens.</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">Testar Conexão</Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Automações de Mensagem</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Enviar Boas-vindas a novos clientes</Label>
                    <Switch 
                      checked={config.msg_auto_welcome === 'true'} 
                      onCheckedChange={(val) => handleChange('msg_auto_welcome', val)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Notificar cliente sobre Pedido Confirmado</Label>
                    <Switch 
                      checked={config.msg_auto_order_confirm === 'true'} 
                      onCheckedChange={(val) => handleChange('msg_auto_order_confirm', val)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Lembrete de Vencimento (2 dias antes)</Label>
                    <Switch 
                      checked={config.msg_auto_due_reminder === 'true'} 
                      onCheckedChange={(val) => handleChange('msg_auto_due_reminder', val)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Notificar Técnico sobre Nova OS</Label>
                    <Switch 
                      checked={config.msg_auto_tech_notify === 'true'} 
                      onCheckedChange={(val) => handleChange('msg_auto_tech_notify', val)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
