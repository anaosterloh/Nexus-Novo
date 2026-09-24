import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Plus, 
  Trash2, 
  GripVertical, 
  Type, 
  CheckSquare, 
  Image as ImageIcon, 
  AlignLeft,
  FileText,
  Settings,
  Calendar,
  Hash,
  List,
  CircleDot,
  Eye,
  PenTool,
  Printer,
  Table as TableIcon,
  Code
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';

interface Field {
  id: string;
  type: 'text' | 'textarea' | 'checkbox' | 'image' | 'signature' | 'date' | 'number' | 'select' | 'radio' | 'table' | 'rich_text';
  label: string;
  required: boolean;
  options?: string[]; // For select/radio/checkbox
  tableConfig?: {
    columns: string[];
    rowNumbering: 'none' | 'sequential' | 'business_days';
  };
  content?: string; // For rich_text (fixed text with variables)
}

interface Section {
  id: string;
  title: string;
  fields: Field[];
}

interface PrintSettings {
  headerText: string;
  footerText: string;
  showPageNumbers: boolean;
  useLetterhead: boolean;
  authenticate: boolean;
  version: string;
}

export function LaudoBuilder({ onSave, onCancel }: { onSave: () => void, onCancel: () => void }) {
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('Manutenção Preventiva');
  const [activeTab, setActiveTab] = useState('builder');
  
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    headerText: '',
    footerText: '',
    showPageNumbers: true,
    useLetterhead: true,
    authenticate: true,
    version: '1.0'
  });

  const [sections, setSections] = useState<Section[]>([
    {
      id: 'sec-1',
      title: 'Dados do Equipamento',
      fields: [
        { id: 'f-1', type: 'text', label: 'Modelo do Equipamento', required: true },
        { id: 'f-2', type: 'text', label: 'Número de Série', required: true },
        { id: 'f-date', type: 'date', label: 'Data da Avaliação', required: true },
      ]
    }
  ]);

  const addSection = () => {
    setSections([
      ...sections,
      {
        id: `sec-${Date.now()}`,
        title: 'Nova Seção',
        fields: []
      }
    ]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSectionTitle = (id: string, title: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, title } : s));
  };

  const addField = (sectionId: string, type: Field['type']) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          fields: [
            ...s.fields,
            {
              id: `f-${Date.now()}`,
              type,
              label: type === 'table' ? 'Nova Tabela' : type === 'rich_text' ? 'Texto Fixo / Variáveis' : 'Novo Campo',
              required: false,
              options: ['select', 'radio', 'checkbox'].includes(type) ? ['Opção 1', 'Opção 2'] : undefined,
              tableConfig: type === 'table' ? { columns: ['Coluna 1', 'Coluna 2'], rowNumbering: 'none' } : undefined,
              content: type === 'rich_text' ? 'Insira o texto aqui. Use #NOME_CLIENTE# para variáveis.' : undefined
            }
          ]
        };
      }
      return s;
    }));
  };

  const removeField = (sectionId: string, fieldId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          fields: s.fields.filter(f => f.id !== fieldId)
        };
      }
      return s;
    }));
  };

  const updateField = (sectionId: string, fieldId: string, updates: Partial<Field>) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          fields: s.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
        };
      }
      return s;
    }));
  };

  const updateFieldOptions = (sectionId: string, fieldId: string, optionsStr: string) => {
    const options = optionsStr.split(',').map(o => o.trim()).filter(o => o);
    updateField(sectionId, fieldId, { options });
  };

  const updateTableColumns = (sectionId: string, fieldId: string, colsStr: string) => {
    const columns = colsStr.split(',').map(c => c.trim()).filter(c => c);
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          fields: s.fields.map(f => f.id === fieldId ? { ...f, tableConfig: { ...f.tableConfig!, columns } } : f)
        };
      }
      return s;
    }));
  };

  const updateTableRowNumbering = (sectionId: string, fieldId: string, rowNumbering: any) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          fields: s.fields.map(f => f.id === fieldId ? { ...f, tableConfig: { ...f.tableConfig!, rowNumbering } } : f)
        };
      }
      return s;
    }));
  };

  const handleSave = () => {
    if (!templateName) {
      toast.error('Informe um nome para o modelo.');
      return;
    }
    toast.success('Modelo salvo com sucesso!');
    onSave();
  };

  const renderFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4 text-blue-500" />;
      case 'textarea': return <AlignLeft className="h-4 w-4 text-emerald-500" />;
      case 'checkbox': return <CheckSquare className="h-4 w-4 text-amber-500" />;
      case 'image': return <ImageIcon className="h-4 w-4 text-purple-500" />;
      case 'signature': return <FileText className="h-4 w-4 text-rose-500" />;
      case 'date': return <Calendar className="h-4 w-4 text-indigo-500" />;
      case 'number': return <Hash className="h-4 w-4 text-cyan-500" />;
      case 'select': return <List className="h-4 w-4 text-orange-500" />;
      case 'radio': return <CircleDot className="h-4 w-4 text-pink-500" />;
      case 'table': return <TableIcon className="h-4 w-4 text-indigo-600" />;
      case 'rich_text': return <Code className="h-4 w-4 text-slate-600" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Construtor de Documentos & Laudos</h2>
          <p className="text-zinc-500">Crie modelos para laudos técnicos, auditorias e cartas comerciais.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={handleSave}>
            <Save className="h-4 w-4" /> Salvar Modelo
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="builder" className="gap-2"><PenTool className="h-4 w-4" /> Construtor</TabsTrigger>
          <TabsTrigger value="preview" className="gap-2"><Eye className="h-4 w-4" /> Visualização (Impressão)</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    Configurações Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Modelo</Label>
                    <Input 
                      placeholder="Ex: Laudo Padrão de Manutenção" 
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={templateCategory} onValueChange={setTemplateCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manutenção Preventiva">Manutenção Preventiva</SelectItem>
                        <SelectItem value="Auditoria Interna">Auditoria Interna</SelectItem>
                        <SelectItem value="Carta Comercial">Carta Comercial</SelectItem>
                        <SelectItem value="Checklist">Checklist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Printer className="h-5 w-5 text-zinc-600" />
                    Impressão & Autenticação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Cabeçalho Personalizado</Label>
                    <Input 
                      placeholder="Texto do cabeçalho..." 
                      value={printSettings.headerText}
                      onChange={(e) => setPrintSettings({...printSettings, headerText: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Rodapé Personalizado</Label>
                    <Input 
                      placeholder="Texto do rodapé..." 
                      value={printSettings.footerText}
                      onChange={(e) => setPrintSettings({...printSettings, footerText: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs cursor-pointer" htmlFor="letterhead">Usar Papel Timbrado (Logo)</Label>
                    <Switch id="letterhead" checked={printSettings.useLetterhead} onCheckedChange={(c) => setPrintSettings({...printSettings, useLetterhead: c})} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs cursor-pointer" htmlFor="pagenums">Numerar Páginas</Label>
                    <Switch id="pagenums" checked={printSettings.showPageNumbers} onCheckedChange={(c) => setPrintSettings({...printSettings, showPageNumbers: c})} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs cursor-pointer" htmlFor="auth">Autenticar (Hash/QR Code)</Label>
                    <Switch id="auth" checked={printSettings.authenticate} onCheckedChange={(c) => setPrintSettings({...printSettings, authenticate: c})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Versão do Documento</Label>
                    <Input 
                      placeholder="Ex: 1.0" 
                      value={printSettings.version}
                      onChange={(e) => setPrintSettings({...printSettings, version: e.target.value})}
                      className="w-24"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">Tipos de Campos</CardTitle>
                  <CardDescription>Clique para adicionar à última seção.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="justify-start gap-2 h-9 text-xs" onClick={() => sections.length > 0 && addField(sections[sections.length - 1].id, 'text')}>
                      <Type className="h-4 w-4 text-blue-500" /> Texto Curto
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-9 text-xs" onClick={() => sections.length > 0 && addField(sections[sections.length - 1].id, 'textarea')}>
                      <AlignLeft className="h-4 w-4 text-emerald-500" /> Texto Longo
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-9 text-xs" onClick={() => sections.length > 0 && addField(sections[sections.length - 1].id, 'number')}>
                      <Hash className="h-4 w-4 text-cyan-500" /> Número
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-9 text-xs" onClick={() => sections.length > 0 && addField(sections[sections.length - 1].id, 'date')}>
                      <Calendar className="h-4 w-4 text-indigo-500" /> Data
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-9 text-xs" onClick={() => sections.length > 0 && addField(sections[sections.length - 1].id, 'select')}>
                      <List className="h-4 w-4 text-orange-500" /> Lista
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-9 text-xs" onClick={() => sections.length > 0 && addField(sections[sections.length - 1].id, 'radio')}>
                      <CircleDot className="h-4 w-4 text-pink-500" /> Única Escolha
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-9 text-xs" onClick={() => sections.length > 0 && addField(sections[sections.length - 1].id, 'checkbox')}>
                      <CheckSquare className="h-4 w-4 text-amber-500" /> Múltipla Escolha
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-9 text-xs" onClick={() => sections.length > 0 && addField(sections[sections.length - 1].id, 'image')}>
                      <ImageIcon className="h-4 w-4 text-purple-500" /> Foto/Anexo
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-9 text-xs col-span-2" onClick={() => sections.length > 0 && addField(sections[sections.length - 1].id, 'table')}>
                      <TableIcon className="h-4 w-4 text-indigo-600" /> Tabela Dinâmica
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-9 text-xs col-span-2" onClick={() => sections.length > 0 && addField(sections[sections.length - 1].id, 'rich_text')}>
                      <Code className="h-4 w-4 text-slate-600" /> Texto Fixo / Variáveis
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-9 text-xs col-span-2" onClick={() => sections.length > 0 && addField(sections[sections.length - 1].id, 'signature')}>
                      <FileText className="h-4 w-4 text-rose-500" /> Assinatura Digital
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-6">
              {sections.map((section, index) => (
                <Card key={section.id} className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b pb-3 pt-3 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <GripVertical className="h-5 w-5 text-zinc-400 cursor-grab" />
                      <Input 
                        value={section.title} 
                        onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                        className="font-bold text-lg border-transparent hover:border-zinc-200 focus-visible:ring-0 px-2 h-8 bg-transparent"
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="text-rose-500 h-8 w-8" onClick={() => removeSection(section.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {section.fields.length === 0 ? (
                      <div className="text-center py-6 border-2 border-dashed rounded-lg border-zinc-200 bg-zinc-50/50">
                        <p className="text-sm text-zinc-500">Nenhum campo nesta seção.</p>
                        <p className="text-xs text-zinc-400">Adicione campos usando o painel lateral.</p>
                      </div>
                    ) : (
                      section.fields.map((field) => (
                        <div key={field.id} className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-950 border rounded-lg group hover:border-emerald-200 transition-colors">
                          <GripVertical className="h-5 w-5 text-zinc-300 cursor-grab mt-2" />
                          <div className="flex-1 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <div className="flex items-center gap-2 flex-1">
                                <div className="p-1.5 bg-zinc-100 rounded-md shrink-0">
                                  {renderFieldIcon(field.type)}
                                </div>
                                <Input 
                                  value={field.label} 
                                  onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                                  className="h-8 text-sm font-medium flex-1"
                                  placeholder="Nome do campo ou título da tabela"
                                />
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Label className="text-xs text-zinc-500 flex items-center gap-1 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={field.required}
                                    onChange={(e) => updateField(section.id, field.id, { required: e.target.checked })}
                                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600"
                                  />
                                  Obrigatório
                                </Label>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-rose-500" onClick={() => removeField(section.id, field.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Configuração de Opções para Select/Radio/Checkbox */}
                            {['select', 'radio', 'checkbox'].includes(field.type) && (
                              <div className="pl-10">
                                <Label className="text-[10px] uppercase text-zinc-500 font-bold mb-1 block">Opções (separadas por vírgula)</Label>
                                <Input 
                                  value={field.options?.join(', ') || ''}
                                  onChange={(e) => updateFieldOptions(section.id, field.id, e.target.value)}
                                  className="h-8 text-xs font-mono"
                                  placeholder="Opção 1, Opção 2, Opção 3..."
                                />
                              </div>
                            )}

                            {/* Configuração de Tabela */}
                            {field.type === 'table' && (
                              <div className="pl-10 space-y-3">
                                <div>
                                  <Label className="text-[10px] uppercase text-zinc-500 font-bold mb-1 block">Colunas da Tabela (separadas por vírgula)</Label>
                                  <Input 
                                    value={field.tableConfig?.columns.join(', ') || ''}
                                    onChange={(e) => updateTableColumns(section.id, field.id, e.target.value)}
                                    className="h-8 text-xs font-mono"
                                    placeholder="Ex: Data, Descrição, Valor, Assinatura"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px] uppercase text-zinc-500 font-bold mb-1 block">Numeração de Linhas</Label>
                                  <Select 
                                    value={field.tableConfig?.rowNumbering || 'none'} 
                                    onValueChange={(v) => updateTableRowNumbering(section.id, field.id, v)}
                                  >
                                    <SelectTrigger className="h-8 text-xs w-64">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Sem numeração automática</SelectItem>
                                      <SelectItem value="sequential">Números corridos (1, 2, 3...)</SelectItem>
                                      <SelectItem value="business_days">Dias úteis do mês</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}

                            {/* Configuração de Texto Fixo/Variáveis */}
                            {field.type === 'rich_text' && (
                              <div className="pl-10 space-y-2">
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-[10px] uppercase text-zinc-500 font-bold block">Conteúdo do Texto</Label>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="link" size="sm" className="h-auto p-0 text-[10px] text-emerald-600">Ver Variáveis Disponíveis</Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>Legenda de Variáveis</DialogTitle>
                                        <DialogDescription>
                                          Utilize as tags abaixo no seu texto. Elas serão substituídas automaticamente pelos dados reais no momento da geração do documento.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="grid grid-cols-2 gap-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                                        <div className="space-y-4">
                                          <div>
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 border-b pb-1">Dados do Cliente/Fornecedor</h4>
                                            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#NOME_CLIENTE#</code> Nome ou Razão Social</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#NOME_FANTASIA#</code> Nome Fantasia</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#CNPJ_CPF#</code> CNPJ ou CPF</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#IE#</code> Inscrição Estadual</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#ENDERECO_COMPLETO#</code> Endereço completo com CEP</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#LOGRADOURO#</code> Apenas Rua/Avenida e Número</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#BAIRRO#</code> Bairro</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#CIDADE_ESTADO#</code> Cidade e UF</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#CEP#</code> CEP</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#TELEFONE#</code> Telefone principal</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#EMAIL#</code> E-mail principal</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#CONTATO_NOME#</code> Nome da pessoa de contato</li>
                                            </ul>
                                          </div>
                                          <div>
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 border-b pb-1">Dados do Equipamento (O.S.)</h4>
                                            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#EQUIP_MODELO#</code> Modelo do Equipamento</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#EQUIP_SERIE#</code> Número de Série</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#EQUIP_MARCA#</code> Marca/Fabricante</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#EQUIP_PATRIMONIO#</code> Número de Patrimônio</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#DEFEITO_RELATADO#</code> Defeito relatado pelo cliente</li>
                                            </ul>
                                          </div>
                                          <div>
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 border-b pb-1">Dados da Empresa (Emissora)</h4>
                                            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#EMP_RAZAO#</code> Razão Social da Empresa</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#EMP_FANTASIA#</code> Nome Fantasia da Empresa</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#EMP_CNPJ#</code> CNPJ da Empresa</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#EMP_ENDERECO#</code> Endereço da Empresa</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#EMP_TELEFONE#</code> Telefone da Empresa</li>
                                            </ul>
                                          </div>
                                        </div>
                                        <div className="space-y-4">
                                          <div>
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 border-b pb-1">Datas e Valores</h4>
                                            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#DATA_ATUAL#</code> Data de emissão (DD/MM/AAAA)</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#DATA_EXTENSO#</code> Data por extenso (Ex: 01 de Janeiro de 2024)</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#MES_ATUAL#</code> Nome do mês atual</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#ANO_ATUAL#</code> Ano atual</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#HORA_ATUAL#</code> Hora da emissão (HH:MM)</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#VALOR_TOTAL#</code> Valor total (se aplicável)</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#VALOR_EXTENSO#</code> Valor total por extenso</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#COND_PGTO#</code> Condição de Pagamento</li>
                                            </ul>
                                          </div>
                                          <div>
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 border-b pb-1">Dados do Pedido / O.S.</h4>
                                            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#NUMERO_DOC#</code> Número do Pedido ou O.S.</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#DATA_PEDIDO#</code> Data de criação do Pedido/O.S.</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#VENDEDOR_NOME#</code> Nome do Vendedor responsável</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#TECNICO_NOME#</code> Nome do Técnico responsável</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#OBSERVACOES#</code> Observações gerais do Pedido/O.S.</li>
                                            </ul>
                                          </div>
                                          <div>
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 border-b pb-1">Outros</h4>
                                            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#USUARIO_LOGADO#</code> Nome do usuário logado</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#ASSINATURA_RESP#</code> Nome do responsável para assinatura</li>
                                              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600">#CODIGO_AUTENTICACAO#</code> Hash/Código de validação do documento</li>
                                            </ul>
                                          </div>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                                <Textarea 
                                  value={field.content || ''}
                                  onChange={(e) => updateField(section.id, field.id, { content: e.target.value })}
                                  className="min-h-[100px] text-sm font-mono bg-zinc-50"
                                  placeholder="Prezado(a) #NOME_CLIENTE#, autorizamos a comercialização..."
                                />
                              </div>
                            )}
                            
                            {/* Preview do campo */}
                            <div className="pl-10 opacity-60 pointer-events-none">
                              {field.type === 'text' && <Input disabled placeholder="Texto curto..." className="h-8 bg-zinc-50" />}
                              {field.type === 'number' && <Input disabled type="number" placeholder="0.00" className="h-8 bg-zinc-50 w-32" />}
                              {field.type === 'date' && <Input disabled type="date" className="h-8 bg-zinc-50 w-40" />}
                              {field.type === 'textarea' && <Textarea disabled className="w-full h-16 bg-zinc-50 text-sm" placeholder="Texto longo..." />}
                              {field.type === 'select' && (
                                <Select disabled>
                                  <SelectTrigger className="h-8 bg-zinc-50"><SelectValue placeholder="Selecione uma opção..." /></SelectTrigger>
                                </Select>
                              )}
                              {field.type === 'radio' && (
                                <div className="flex flex-wrap gap-4">
                                  {field.options?.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-1"><input type="radio" disabled /> <span className="text-xs">{opt}</span></div>
                                  ))}
                                </div>
                              )}
                              {field.type === 'checkbox' && (
                                <div className="flex flex-wrap gap-4">
                                  {field.options?.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-1"><input type="checkbox" disabled /> <span className="text-xs">{opt}</span></div>
                                  ))}
                                </div>
                              )}
                              {field.type === 'image' && <div className="h-16 w-full border-2 border-dashed rounded-md flex items-center justify-center bg-zinc-50"><ImageIcon className="h-6 w-6 text-zinc-300" /></div>}
                              {field.type === 'signature' && <div className="h-16 w-full border-b-2 border-dashed flex items-end pb-2 justify-center bg-zinc-50"><span className="text-xs text-zinc-400">Área de Assinatura</span></div>}
                              {field.type === 'table' && (
                                <div className="border rounded-md overflow-hidden bg-white">
                                  <table className="w-full text-xs text-left">
                                    <thead className="bg-zinc-100">
                                      <tr>
                                        {field.tableConfig?.rowNumbering !== 'none' && <th className="p-2 border-b w-10">#</th>}
                                        {field.tableConfig?.columns.map((c, i) => <th key={i} className="p-2 border-b">{c}</th>)}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        {field.tableConfig?.rowNumbering !== 'none' && <td className="p-2 border-b text-zinc-400">1</td>}
                                        {field.tableConfig?.columns.map((_, i) => <td key={i} className="p-2 border-b text-zinc-300">...</td>)}
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="flex-1 border-dashed gap-2 text-zinc-500" onClick={() => addField(section.id, 'text')}>
                        <Plus className="h-4 w-4" /> Adicionar Campo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" className="w-full border-dashed h-12 gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={addSection}>
                <Plus className="h-5 w-5" /> Adicionar Nova Seção
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card className="max-w-4xl mx-auto border-zinc-200 shadow-lg bg-white">
            {/* Cabeçalho Impressão */}
            {printSettings.useLetterhead && (
              <div className="border-b-4 border-emerald-600 p-6 flex items-center justify-between bg-zinc-50">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">L</div>
                  <div>
                    <h1 className="font-bold text-lg">Sua Empresa Ltda</h1>
                    <p className="text-xs text-zinc-500">CNPJ: 00.000.000/0001-00</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="font-bold text-xl text-zinc-800">{templateName || 'Documento'}</h2>
                  <p className="text-xs text-zinc-500">Data: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            )}

            {printSettings.headerText && (
              <div className="px-8 pt-6 pb-2 text-center border-b">
                <p className="text-sm font-medium text-zinc-600">{printSettings.headerText}</p>
              </div>
            )}

            <CardContent className="p-8 space-y-8 min-h-[500px]">
              {sections.map((section) => (
                <div key={section.id} className="space-y-4">
                  <h3 className="text-lg font-bold border-b pb-2 text-zinc-800 dark:text-zinc-200">{section.title}</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {section.fields.map((field) => (
                      <div key={field.id} className="space-y-1.5">
                        {field.type !== 'rich_text' && (
                          <Label className="text-sm font-medium flex items-center gap-1">
                            {field.label}
                            {field.required && <span className="text-rose-500">*</span>}
                          </Label>
                        )}
                        
                        {field.type === 'text' && <Input placeholder="Resposta..." />}
                        {field.type === 'number' && <Input type="number" placeholder="0" />}
                        {field.type === 'date' && <Input type="date" />}
                        {field.type === 'textarea' && <Textarea placeholder="Resposta detalhada..." className="min-h-[100px]" />}
                        
                        {field.type === 'select' && (
                          <Select>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                              {field.options?.map((opt, i) => (
                                <SelectItem key={i} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        
                        {field.type === 'radio' && (
                          <div className="flex flex-col gap-2 mt-2">
                            {field.options?.map((opt, i) => (
                              <Label key={i} className="flex items-center gap-2 font-normal cursor-pointer">
                                <input type="radio" name={`radio-${field.id}`} className="text-emerald-600 focus:ring-emerald-600" />
                                {opt}
                              </Label>
                            ))}
                          </div>
                        )}
                        
                        {field.type === 'checkbox' && (
                          <div className="flex flex-col gap-2 mt-2">
                            {field.options?.map((opt, i) => (
                              <Label key={i} className="flex items-center gap-2 font-normal cursor-pointer">
                                <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-600" />
                                {opt}
                              </Label>
                            ))}
                          </div>
                        )}
                        
                        {field.type === 'image' && (
                          <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-zinc-500 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer">
                            <ImageIcon className="h-8 w-8 mb-2 text-zinc-400" />
                            <span className="text-sm font-medium">Clique para anexar foto</span>
                            <span className="text-xs">JPG, PNG, PDF</span>
                          </div>
                        )}
                        
                        {field.type === 'signature' && (
                          <div className="border rounded-lg p-4 bg-zinc-50 mt-2">
                            <div className="h-32 border-b-2 border-dashed border-zinc-300 mb-4 flex items-end justify-center pb-2">
                              <span className="text-zinc-400 text-sm italic">Assine aqui</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-zinc-500">Assinatura Digital</span>
                              <Button variant="outline" size="sm">Limpar</Button>
                            </div>
                          </div>
                        )}

                        {field.type === 'table' && (
                          <div className="border rounded-md overflow-hidden mt-2">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-zinc-100">
                                <tr>
                                  {field.tableConfig?.rowNumbering !== 'none' && <th className="p-3 border-b w-12 text-center text-zinc-500">#</th>}
                                  {field.tableConfig?.columns.map((c, i) => <th key={i} className="p-3 border-b font-semibold text-zinc-700">{c}</th>)}
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {[1, 2, 3].map((row) => (
                                  <tr key={row} className="hover:bg-zinc-50">
                                    {field.tableConfig?.rowNumbering !== 'none' && (
                                      <td className="p-3 text-center text-zinc-400 font-mono text-xs">
                                        {field.tableConfig?.rowNumbering === 'business_days' ? `${row}/03` : row}
                                      </td>
                                    )}
                                    {field.tableConfig?.columns.map((_, i) => (
                                      <td key={i} className="p-3"><Input className="h-8 border-transparent hover:border-zinc-200 focus:border-emerald-500 bg-transparent" /></td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="p-2 bg-zinc-50 border-t">
                              <Button variant="ghost" size="sm" className="text-xs text-zinc-500"><Plus className="h-3 w-3 mr-1" /> Adicionar Linha</Button>
                            </div>
                          </div>
                        )}

                        {field.type === 'rich_text' && (
                          <div className="prose prose-sm max-w-none mt-2 p-4 bg-zinc-50 rounded-lg border">
                            {field.content?.split('\n').map((line, i) => (
                              <p key={i} className="mb-2 last:mb-0">
                                {line.split(/(#[A-Z_]+#)/g).map((part, j) => {
                                  if (part.startsWith('#') && part.endsWith('#')) {
                                    return <span key={j} className="bg-emerald-100 text-emerald-800 px-1 rounded font-mono text-xs">{part}</span>;
                                  }
                                  return part;
                                })}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {section.fields.length === 0 && (
                      <p className="text-sm text-zinc-400 italic">Nenhum campo configurado nesta seção.</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>

            {/* Rodapé Impressão */}
            <div className="border-t px-8 py-6 bg-zinc-50 text-xs text-zinc-500 flex flex-col gap-4">
              {printSettings.footerText && (
                <div className="text-center">
                  <p>{printSettings.footerText}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  {printSettings.authenticate && (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-zinc-200 rounded flex items-center justify-center">QR</div>
                      <div>
                        <p className="font-bold text-zinc-700">Documento Autenticado</p>
                        <p className="font-mono text-[10px]">Hash: 8f4e2a...9b1c</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p>Versão: {printSettings.version}</p>
                  {printSettings.showPageNumbers && <p>Página 1 de 1</p>}
                </div>
              </div>
            </div>
          </Card>
          
          <div className="max-w-4xl mx-auto mt-4 flex justify-end gap-2">
            <Button variant="outline" disabled>Cancelar</Button>
            <Button className="bg-emerald-600" disabled>Finalizar Documento</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
