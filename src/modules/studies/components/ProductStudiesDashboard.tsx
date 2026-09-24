import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Building2, 
  Package, 
  Globe, 
  Calendar, 
  Phone, 
  ShieldCheck, 
  ShieldAlert,
  ChevronRight,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { ProductStudy } from '../types';
import { StudyForm } from './StudyForm';
import { StudyDetails } from './StudyDetails';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock data for initial view
const mockStudies: ProductStudy[] = [
  {
    id: '1',
    productName: 'Válvula Hidráulica V-200',
    companyName: 'HydraTech Solutions',
    origin: 'international',
    definitions: 'Válvula de alta pressão para sistemas industriais.',
    composition: 'Aço inoxidável 316, vedações em Viton.',
    usage: 'Controle de fluxo em refinarias e usinas.',
    internalContact: {
      name: 'John Smith',
      phones: ['+1 555-0123'],
      email: 'john@hydratech.com'
    },
    reliability: 'high',
    businessObservations: 'Empresa sólida, prazos de entrega confiáveis.',
    history: [
      { date: '2024-01-15', event: 'Primeiro contato', notes: 'Amostra solicitada.' },
      { date: '2024-02-10', event: 'Teste de bancada', notes: 'Aprovado com ressalvas na vedação.' }
    ],
    events: [
      { id: 'e1', title: 'Hannover Messe 2024', date: '2024-04-22', location: 'Alemanha', type: 'fair' },
      { id: 'e2', title: 'Reunião Técnica Online', date: '2024-03-05', type: 'meeting' }
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-02-15'
  },
  {
    id: '2',
    productName: 'Sensor de Proximidade S-50',
    companyName: 'Sensores Brasil S.A.',
    origin: 'national',
    definitions: 'Sensor indutivo para automação de linhas de montagem.',
    composition: 'Corpo em latão niquelado, eletrônica encapsulada em resina.',
    usage: 'Detecção de peças metálicas em esteiras.',
    internalContact: {
      name: 'Maria Oliveira',
      phones: ['(11) 98765-4321'],
      email: 'maria@sensoresbrasil.com.br'
    },
    reliability: 'medium',
    businessObservations: 'Preço competitivo, mas suporte técnico lento.',
    history: [
      { date: '2024-01-20', event: 'Visita à fábrica', notes: 'Instalações modernas.' }
    ],
    events: [
      { id: 'e3', title: 'FEIMEC 2024', date: '2024-05-07', location: 'São Paulo', type: 'fair' }
    ],
    createdAt: '2024-01-10',
    updatedAt: '2024-01-20'
  }
];

export function ProductStudiesDashboard() {
  const [studies, setStudies] = useState<ProductStudy[]>(mockStudies);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<ProductStudy | null>(null);
  const [viewMode, setViewMode] = useState<'company' | 'product'>('product');

  const filteredStudies = studies.filter(study => 
    study.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const studiesByCompany = filteredStudies.reduce((acc, study) => {
    const company = study.companyName;
    if (!acc[company]) {
      acc[company] = [];
    }
    acc[company].push(study);
    return acc;
  }, {} as Record<string, ProductStudy[]>);

  const getReliabilityBadge = (reliability: ProductStudy['reliability']) => {
    switch (reliability) {
      case 'high': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><ShieldCheck className="h-3 w-3 mr-1" /> Alta</Badge>;
      case 'medium': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Média</Badge>;
      case 'low': return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><ShieldAlert className="h-3 w-3 mr-1" /> Baixa</Badge>;
      case 'unreliable': return <Badge variant="destructive">Não Confiável</Badge>;
      default: return <Badge variant="secondary">{reliability}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Estudos e Observações de Produtos</h2>
          <p className="text-zinc-500 text-sm">Análise detalhada de produtos nacionais e internacionais, histórico e contatos.</p>
        </div>
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700 shadow-sm gap-2"
          onClick={() => {
            setSelectedStudy(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Novo Estudo
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Buscar por produto ou empresa..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="product" onValueChange={(v) => setViewMode(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="product" className="gap-2">
            <Package className="h-4 w-4" /> Por Produto
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" /> Por Empresa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="product" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Confiabilidade</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudies.map((study) => (
                    <TableRow 
                      key={study.id} 
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      onClick={() => setSelectedStudy(study)}
                    >
                      <TableCell className="font-medium">{study.productName}</TableCell>
                      <TableCell>{study.companyName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {study.origin === 'international' ? <Globe className="h-3 w-3 text-blue-500" /> : <Building2 className="h-3 w-3 text-emerald-500" />}
                          <span className="text-xs">{study.origin === 'international' ? 'Internacional' : 'Nacional'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getReliabilityBadge(study.reliability)}</TableCell>
                      <TableCell className="text-xs text-zinc-500">
                        {format(new Date(study.updatedAt), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(Object.entries(studiesByCompany) as [string, ProductStudy[]][]).map(([company, companyStudies]) => (
              <Card key={company} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white dark:bg-zinc-800 border flex items-center justify-center shadow-sm">
                      <Building2 className="h-5 w-5 text-zinc-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{company}</CardTitle>
                      <CardDescription>{companyStudies.length} produto(s) estudado(s)</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {companyStudies.map(study => (
                      <div 
                        key={study.id} 
                        className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer flex items-center justify-between group"
                        onClick={() => setSelectedStudy(study)}
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{study.productName}</p>
                          <div className="flex items-center gap-2">
                            {getReliabilityBadge(study.reliability)}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-900" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <StudyForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        onSuccess={(newStudy) => {
          setStudies([...studies, newStudy]);
          toast.success('Estudo cadastrado com sucesso!');
        }}
      />

      {selectedStudy && (
        <StudyDetails 
          study={selectedStudy} 
          open={!!selectedStudy} 
          onOpenChange={(open) => !open && setSelectedStudy(null)}
          onEdit={(study) => {
            // Logic to open form in edit mode
            setSelectedStudy(null);
            setIsFormOpen(true);
          }}
        />
      )}
    </div>
  );
}
