import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Plus, FileText, CheckCircle2, XCircle, Clock, Eye, Send, Hash, User, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/usePermissions';

export function CommercialLetters() {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const mockLetters = [
    {
      id: 'CARTA-2024-001',
      client: 'Hospital Santa Maria',
      type: 'Autorização de Comercialização',
      status: 'pending',
      requestedBy: 'João Vendedor',
      date: '2024-03-20',
      clientStatus: {
        openPayments: false,
        delayedDocs: false,
        recentPurchase: true
      }
    },
    {
      id: 'CARTA-2024-002',
      client: 'Clínica São José',
      type: 'Autorização de Comercialização',
      status: 'approved',
      requestedBy: 'Maria Vendedora',
      date: '2024-03-18',
      clientStatus: {
        openPayments: false,
        delayedDocs: false,
        recentPurchase: true
      }
    },
    {
      id: 'CARTA-2024-003',
      client: 'Centro Médico Avançado',
      type: 'Autorização de Comercialização',
      status: 'rejected',
      requestedBy: 'Pedro Vendedor',
      date: '2024-03-15',
      clientStatus: {
        openPayments: true,
        delayedDocs: true,
        recentPurchase: false
      }
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Aprovada</Badge>;
      case 'rejected': return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200">Rejeitada</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Aguardando Análise</Badge>;
      default: return <Badge>Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cartas de Comercialização</h2>
          <p className="text-zinc-500">Gerencie solicitações e emita cartas de autorização para clientes.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setIsNewModalOpen(true)}>
          <Plus className="h-4 w-4" /> Nova Solicitação
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar por cliente ou número..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {mockLetters.map((letter) => (
          <Card key={letter.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{letter.client}</h3>
                      {getStatusBadge(letter.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {letter.id}</span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> Solicitante: {letter.requestedBy}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {letter.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedLetter(letter)}>
                    <Eye className="h-4 w-4 mr-2" /> Analisar / Ver
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Análise / Emissão */}
      <Dialog open={!!selectedLetter} onOpenChange={(open) => !open && setSelectedLetter(null)}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Análise de Solicitação: {selectedLetter?.id}</DialogTitle>
            <DialogDescription>
              Verifique a situação do cliente antes de aprovar e emitir a carta.
            </DialogDescription>
          </DialogHeader>

          {selectedLetter && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-zinc-50">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                    {selectedLetter.clientStatus.openPayments ? (
                      <XCircle className="h-8 w-8 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    )}
                    <div>
                      <p className="font-bold text-sm">Financeiro</p>
                      <p className="text-xs text-zinc-500">
                        {selectedLetter.clientStatus.openPayments ? 'Pendências em aberto' : 'Tudo em dia'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-50">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                    {selectedLetter.clientStatus.delayedDocs ? (
                      <XCircle className="h-8 w-8 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    )}
                    <div>
                      <p className="font-bold text-sm">Documentação</p>
                      <p className="text-xs text-zinc-500">
                        {selectedLetter.clientStatus.delayedDocs ? 'Documentos vencidos' : 'Atualizada'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-50">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                    {selectedLetter.clientStatus.recentPurchase ? (
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    ) : (
                      <Clock className="h-8 w-8 text-amber-500" />
                    )}
                    <div>
                      <p className="font-bold text-sm">Histórico</p>
                      <p className="text-xs text-zinc-500">
                        {selectedLetter.clientStatus.recentPurchase ? 'Compras recentes' : 'Sem compras recentes'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedLetter.status === 'pending' && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800 font-medium mb-2">Ação Requerida</p>
                  <div className="flex gap-2">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">Aprovar e Emitir Carta</Button>
                    <Button variant="destructive">Rejeitar Solicitação</Button>
                  </div>
                </div>
              )}

              {selectedLetter.status === 'approved' && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-bold text-sm">Pré-visualização da Carta (Gerada Automaticamente)</h4>
                  <div className="border p-8 rounded-lg bg-white shadow-sm font-serif text-sm space-y-4">
                    <div className="text-center mb-8">
                      <h1 className="font-bold text-lg">Sua Empresa Ltda</h1>
                      <p className="text-xs text-zinc-500">CARTA DE AUTORIZAÇÃO DE COMERCIALIZAÇÃO</p>
                    </div>
                    <p className="text-right">São Paulo, {new Date().toLocaleDateString()}</p>
                    <p>Ao cliente: <strong>{selectedLetter.client}</strong></p>
                    <p className="text-justify leading-relaxed">
                      Pela presente, autorizamos a empresa {selectedLetter.client}, inscrita no CNPJ sob o nº 00.000.000/0001-00, 
                      estabelecida no endereço Rua Exemplo, 123, a comercializar os produtos adquiridos através da nota fiscal 
                      nº 12345, em conformidade com as normas vigentes.
                    </p>
                    <p className="text-justify leading-relaxed">
                      Esta autorização é válida por 12 meses a partir da data de emissão.
                    </p>
                    <div className="mt-16 text-center">
                      <div className="w-64 border-t border-black mx-auto mb-2"></div>
                      <p className="font-bold">Diretoria Comercial</p>
                      <p className="text-xs">Sua Empresa Ltda</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline"><Send className="h-4 w-4 mr-2" /> Enviar por E-mail</Button>
                    <Button><FileText className="h-4 w-4 mr-2" /> Imprimir / PDF</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
