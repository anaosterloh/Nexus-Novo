import React, { useState, MouseEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Filter, 
  Search,
  FileSpreadsheet,
  FileJson,
  Printer,
  Plus,
  Copy,
  Trash2,
  Edit,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ReportEditor } from './ReportEditor';
import { getInvalidVariables, getRequiredEntities, resolveVariables } from './reportVariables';

const INITIAL_TEMPLATES = [
  { id: 'vendas_periodo', name: 'Vendas por Período', category: 'Vendas', description: 'Relatório detalhado de todas as vendas em um intervalo de datas.', content: 'Relatório de vendas padrão.', isCustom: false },
  { id: 'estoque_baixo', name: 'Produtos com Estoque Baixo', category: 'Estoque', description: 'Lista de produtos que atingiram o nível mínimo de segurança.', content: 'Relatório de estoque padrão.', isCustom: false },
  { id: 'financeiro_fluxo', name: 'Fluxo de Caixa Mensal', category: 'Financeiro', description: 'Visão geral de entradas e saídas previstas e realizadas.', content: 'Relatório de caixa padrão.', isCustom: false },
  { id: 'clientes_inativos', name: 'Clientes Inativos', category: 'Cadastros', description: 'Clientes que não realizam compras há mais de 90 dias.', content: 'Relatório de clientes padrão.', isCustom: false },
  { id: 'relatorio_tecnico', name: 'Relatório Técnico Simples', category: 'Técnico', description: 'Modelo básico para atendimentos em campo.', content: '<p><strong>Atendimento:</strong> {{os.numero}}</p><p><strong>Cliente:</strong> {{cliente.nome}} - {{cliente.endereco}}</p><p>O equipamento <em>{{os.marca}} {{os.modelo}}</em> apresentou o seguinte problema: {{os.defeito}}.</p>', isCustom: true },
];

export function ReportGenerator() {
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  // Mocks for selected entities the user simulates during "Preview/Generate" phase
  const [selectedEntities, setSelectedEntities] = useState<Record<string, boolean>>({});

  const filteredTemplates = templates.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerate = (format: string) => {
    if (!selectedTemplate) return;
    
    const required = getRequiredEntities(selectedTemplate.content);
    const missing = required.filter(ent => !selectedEntities[ent]);
    
    if (missing.length > 0) {
      toast.error(`Atenção: Você precisa selecionar as seguintes entidades: ${missing.join(', ')}`);
      // We do not return immediately, maybe they want to generate anyway, but we should warn
    }

    const invalid = getInvalidVariables(selectedTemplate.content);
    if (invalid.length > 0) {
      toast.error(`O modelo possui variáveis inválidas que não serão processadas: ${invalid.join(', ')}`);
    }

    setGenerating(true);
    setTimeout(() => {
      toast.success(`Relatório "${selectedTemplate.name}" gerado em ${format.toUpperCase()}!`);
      setGenerating(false);
    }, 2000);
  };

  const handleSaveTemplate = (savedTemplate: any) => {
    if (templates.some(t => t.id === savedTemplate.id)) {
      setTemplates(templates.map(t => t.id === savedTemplate.id ? savedTemplate : t));
      if (selectedTemplate?.id === savedTemplate.id) setSelectedTemplate(savedTemplate);
      toast.success('Modelo atualizado com sucesso!');
    } else {
      setTemplates([savedTemplate, ...templates]);
      setSelectedTemplate(savedTemplate);
      toast.success('Novo modelo criado com sucesso!');
    }
  };

  const handleDuplicate = (template: any, e: MouseEvent) => {
    e.stopPropagation();
    const newTemplate = {
      ...template,
      id: `custom_${Date.now()}`,
      name: `${template.name} (Cópia)`,
      isCustom: true
    };
    setTemplates([newTemplate, ...templates]);
    toast.success('Modelo duplicado!');
  };

  const handleDelete = (templateId: string, e: MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este modelo?')) {
      setTemplates(templates.filter(t => t.id !== templateId));
      if (selectedTemplate?.id === templateId) setSelectedTemplate(null);
      toast.success('Modelo excluído!');
    }
  };

  const handleEntitySelection = (entity: string, hasData: boolean) => {
    setSelectedEntities(prev => ({ ...prev, [entity]: hasData }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gerador de Relatórios</h2>
          <p className="text-muted-foreground">Crie modelos e gere relatórios personalizados do sistema.</p>
        </div>
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          onClick={() => {
            setEditingTemplate(null);
            setIsEditorOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Novo Modelo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Buscar modelos..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all hover:border-emerald-500 ${selectedTemplate?.id === template.id ? 'border-emerald-500 ring-1 ring-emerald-500' : ''}`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant={template.isCustom ? "default" : "outline"} className={`text-[10px] uppercase ${template.isCustom ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : ''}`}>
                      {template.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-zinc-600" onClick={(e) => handleDuplicate(template, e)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      {template.isCustom && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={(e) => handleDelete(template.id, e)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-sm font-bold mt-2">{template.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex flex-col justify-between h-full">
                  <p className="text-xs text-zinc-500 line-clamp-2 mb-4">{template.description}</p>
                  
                  <div className="flex gap-2 mt-auto">
                    {template.isCustom && (
                      <Button 
                        variant="outline"
                        size="sm" 
                        className="flex-1 text-xs px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTemplate(template);
                          setIsEditorOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" /> Editar
                      </Button>
                    )}
                    <Button 
                      variant={selectedTemplate?.id === template.id ? "default" : "outline"} 
                      size="sm" 
                      className="flex-1 text-xs px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplate(template);
                      }}
                    >
                      Selecionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg text-zinc-500">
              <FileText className="mx-auto h-8 w-8 mb-3 opacity-20" />
              <p>Nenhum modelo encontrado com esse nome.</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card className="sticky top-6">
            <CardHeader className="bg-zinc-50 border-b pb-4">
              <CardTitle className="text-sm font-bold">Parâmetros de Geração</CardTitle>
              <CardDescription>Configure os dados para o modelo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {!selectedTemplate ? (
                <div className="text-center py-8">
                  <Filter className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">Selecione ou crie um modelo ao lado para gerar o relatório.</p>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 mb-4">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 text-center">{selectedTemplate.name}</p>
                  </div>

                  {getRequiredEntities(selectedTemplate.content).length > 0 && (
                    <div className="space-y-3 bg-zinc-50 p-3 rounded-md border">
                      <Label className="text-xs font-semibold text-zinc-700">Fontes de Dados Necessárias</Label>
                      {getRequiredEntities(selectedTemplate.content).map(entity => (
                        <div key={entity} className="space-y-1">
                          <Label className="text-[10px] uppercase text-zinc-500">Selecionar {entity}</Label>
                          <Select onValueChange={(val) => handleEntitySelection(entity, val !== 'none')}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder={`Escolher ${entity}...`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum Selecionado</SelectItem>
                              <SelectItem value="mock1">Opção de Teste 1</SelectItem>
                              <SelectItem value="mock2">Opção de Teste 2</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {getInvalidVariables(selectedTemplate.content).length > 0 && (
                    <div className="p-2 bg-red-50 text-red-700 border border-red-200 rounded text-xs flex gap-2 items-start">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>Este modelo contém variáveis inválidas.</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Formato de Saída</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-col h-auto py-2 gap-1"
                        onClick={() => handleGenerate('pdf')}
                        disabled={generating}
                      >
                        <FileText className="h-4 w-4 text-red-500" />
                        <span className="text-[10px]">PDF</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-col h-auto py-2 gap-1 bg-zinc-100 opacity-50 cursor-not-allowed"
                        disabled={true}
                      >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        <span className="text-[10px]">Excel</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-col h-auto py-2 gap-1 bg-zinc-100 opacity-50 cursor-not-allowed"
                        disabled={true}
                      >
                        <FileJson className="h-4 w-4 text-blue-500" />
                        <span className="text-[10px]">JSON</span>
                      </Button>
                    </div>
                  </div>

                  <Separator />
                  
                  <div className="pt-2">
                    <Label className="text-xs font-semibold block mb-2">Pré-visualização Rápida</Label>
                    <div className="text-[10px] text-zinc-600 bg-zinc-50 p-3 rounded border h-32 overflow-y-auto" dangerouslySetInnerHTML={{ __html: resolveVariables(selectedTemplate.content, selectedEntities) }} />
                  </div>

                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 mt-2" 
                    disabled={generating}
                    onClick={() => handleGenerate('pdf')}
                  >
                    {generating ? 'Gerando...' : 'Gerar Relatório'}
                    {!generating && <Download className="ml-2 h-4 w-4" />}
                  </Button>
                  
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ReportEditor 
        open={isEditorOpen} 
        onOpenChange={setIsEditorOpen} 
        template={editingTemplate}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
