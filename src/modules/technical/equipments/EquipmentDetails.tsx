import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, CheckCircle, PenTool, FileText, AlertCircle, Clock } from 'lucide-react';
import { equipmentService } from './equipmentService';
import { Equipment, EquipmentHistory } from './types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function EquipmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [history, setHistory] = useState<EquipmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (eqId: string) => {
    try {
      setLoading(true);
      const [eqData, histData] = await Promise.all([
        equipmentService.getEquipment(eqId),
        equipmentService.getEquipmentHistory(eqId)
      ]);
      setEquipment(eqData);
      setHistory(histData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Carregando detalhes...</div>;
  }

  if (error || !equipment) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-red-500">{error || 'Equipamento não encontrado'}</div>
        <Button variant="outline" onClick={() => navigate('/tecnica/equipamentos')}>Voltar</Button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-zinc-100 text-zinc-800',
    maintenance: 'bg-orange-100 text-orange-800',
    blocked: 'bg-red-100 text-red-800',
    discarded: 'bg-zinc-800 text-zinc-100',
  };

  const statusLabels: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    maintenance: 'Em Manutenção',
    blocked: 'Bloqueado',
    discarded: 'Descartado',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tecnica/equipamentos')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{equipment.name}</h1>
            <Badge className={statusColors[equipment.operational_status] || 'bg-zinc-100 text-zinc-800'}>
              {statusLabels[equipment.operational_status] || equipment.operational_status}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500">
            {equipment.ownership_type === 'customer' ? 'Equipamento de Cliente' : 'Equipamento da Empresa'} 
            {equipment.serial_number ? ` • S/N: ${equipment.serial_number}` : ''}
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white border border-zinc-200">
          <TabsTrigger value="general" className="data-[state=active]:bg-zinc-100">Dados Gerais</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-zinc-100">Histórico</TabsTrigger>
          <TabsTrigger value="os" className="data-[state=active]:bg-zinc-100">Ordens de Serviço</TabsTrigger>
          <TabsTrigger value="docs" className="data-[state=active]:bg-zinc-100">Documentos</TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-zinc-100">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Informações Principais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-500">Marca</p>
                    <p className="font-medium">{equipment.brand || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Modelo</p>
                    <p className="font-medium">{equipment.model || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Tipo / Categoria</p>
                    <p className="font-medium">{equipment.equipment_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Código Interno</p>
                    <p className="font-medium">{equipment.internal_code || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Número de Série</p>
                    <p className="font-mono text-sm">{equipment.serial_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Patrimônio</p>
                    <p className="font-mono text-sm">{equipment.patrimony || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Localização e Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-500">Cliente Pertencente</p>
                  <p className="font-medium">
                    {equipment.ownership_type === 'company' ? 'Própria (Nexus)' : (equipment.customer_id || 'Não informado')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Setor/Localização Física</p>
                  <p className="font-medium">{equipment.location_description || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Status Informativo</p>
                  <p className="font-medium">{equipment.informative_status || '-'}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Notas Públicas</p>
                  <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 min-h-[100px] text-sm text-zinc-700 whitespace-pre-wrap">
                    {equipment.public_notes || '-'}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Notas Internas (Equipe Técnica)</p>
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 min-h-[100px] text-sm text-amber-800 whitespace-pre-wrap">
                    {equipment.internal_notes || '-'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Histórico (Últimos 6 Meses)</CardTitle>
              <CardDescription>Registro de alterações e eventos do equipamento</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center text-zinc-500 py-8">Nenhum histórico encontrado.</div>
              ) : (
                <div className="relative border-l border-zinc-200 ml-3 space-y-6 pb-4">
                  {history.map((item, index) => (
                    <div key={item.id} className="relative pl-6">
                      <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white bg-zinc-300" />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-zinc-900">{item.action}</span>
                          <span className="text-xs text-zinc-400">• {new Date(item.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-zinc-600 mt-1">{item.description}</p>
                        )}
                        <p className="text-xs text-zinc-400 mt-1">Por: {item.created_by}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="os" className="mt-6">
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <PenTool className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Ordens de Serviço</h2>
              <p className="text-zinc-500 max-w-md">
                Esta aba listará todas as OS vinculadas a este equipamento. Funcionalidade em construção para a próxima fase.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="mt-6">
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Documentos e Laudos</h2>
              <p className="text-zinc-500 max-w-md">
                Manuais, certificados de calibração e laudos técnicos ficarão armazenados aqui. Em construção.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Alertas e Preventivas</h2>
              <p className="text-zinc-500 max-w-md">
                Avisos automáticos sobre manutenções preventivas vencendo e alertas operacionais. Em construção.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
