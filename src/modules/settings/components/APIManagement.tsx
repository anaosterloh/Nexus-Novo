import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  ShieldCheck, 
  Zap, 
  MessageSquare, 
  CreditCard, 
  Truck, 
  Database,
  Search,
  Settings2,
  AlertCircle,
  ExternalLink,
  Key
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface APIConfig {
  id: string;
  name: string;
  description: string;
  category: 'payment' | 'shipping' | 'communication' | 'auth' | 'data';
  status: 'active' | 'inactive';
  icon: any;
  apiKey?: string;
}

export function APIManagement() {
  const [apis, setApis] = useState<APIConfig[]>([
    { 
      id: 'stripe', 
      name: 'Stripe Payments', 
      description: 'Processamento de cartões de crédito e pagamentos recorrentes.', 
      category: 'payment', 
      status: 'active', 
      icon: CreditCard 
    },
    { 
      id: 'correios', 
      name: 'Correios SIGEP', 
      description: 'Cálculo de frete e geração de etiquetas de postagem.', 
      category: 'shipping', 
      status: 'active', 
      icon: Truck 
    },
    { 
      id: 'whatsapp', 
      name: 'WhatsApp Business API', 
      description: 'Envio de notificações e mensagens automáticas para clientes.', 
      category: 'communication', 
      status: 'inactive', 
      icon: MessageSquare 
    },
    { 
      id: 'google-maps', 
      name: 'Google Maps Platform', 
      description: 'Geocodificação e visualização de endereços de clientes.', 
      category: 'data', 
      status: 'active', 
      icon: Globe 
    },
    { 
      id: 'nfe-io', 
      name: 'NFe.io', 
      description: 'Emissão automática de Notas Fiscais de Serviço e Produto.', 
      category: 'data', 
      status: 'inactive', 
      icon: FileText 
    }
  ]);

  const toggleApi = (id: string) => {
    setApis(apis.map(api => 
      api.id === id ? { ...api, status: api.status === 'active' ? 'inactive' : 'active' } : api
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de APIs</h2>
          <p className="text-zinc-500">Conecte e configure integrações externas para o seu ERP.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar Integração
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {apis.map((api) => (
          <Card key={api.id} className={cn(
            "relative overflow-hidden transition-all",
            api.status === 'active' ? "border-emerald-500/50 shadow-emerald-500/5" : "opacity-80 grayscale-[0.5]"
          )}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={cn(
                  "p-2 rounded-lg",
                  api.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                )}>
                  <api.icon className="h-5 w-5" />
                </div>
                <Switch 
                  checked={api.status === 'active'} 
                  onCheckedChange={() => toggleApi(api.id)}
                />
              </div>
              <div className="mt-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  {api.name}
                  {api.status === 'active' && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">ATIVO</Badge>}
                </CardTitle>
                <CardDescription className="text-xs mt-1 leading-relaxed">
                  {api.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
                    <Key className="h-3 w-3" /> API Key / Token
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      type="password" 
                      value="••••••••••••••••" 
                      readOnly 
                      className="h-8 text-xs bg-zinc-50 dark:bg-zinc-900"
                    />
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500">Última sincronização: Hoje, 10:45</span>
                  <Button variant="link" className="h-auto p-0 text-[10px] text-blue-600 gap-1">
                    Documentação <ExternalLink className="h-2 w-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-zinc-900 text-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <CardTitle>Segurança e Privacidade</CardTitle>
              <CardDescription className="text-zinc-400">Todas as chaves de API são criptografadas em repouso.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
            <p className="text-xs text-zinc-300">
              Certifique-se de usar chaves de API de produção apenas em ambientes seguros. Nunca compartilhe suas chaves com terceiros não autorizados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FileText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}

function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

import { cn } from '@/lib/utils';
