// src/modules/settings/components/ReportEditor.tsx
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_REPORT_VARIABLES, getInvalidVariables, getRequiredEntities, resolveVariables, ReportVariable, VariableSourceType } from './reportVariables';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ChevronRight, Eye, Settings, FileText, LayoutTemplate, PlusCircle, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Try to use the existing JoditWrapper
import { JoditWrapper, JoditWrapperRef } from '@/modules/documents/components/JoditWrapper';
import { ReportDocumentCanvas } from './ReportDocumentCanvas';
import { Switch } from '@/components/ui/switch';

interface ReportTemplate {
  id: string;
  name: string;
  category: string;
  reportType: string;
  description: string;
  content: string;
  headerContent: string;
  footerContent: string;
  isCustom: boolean;
  status: 'active' | 'inactive';
}

interface ReportEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ReportTemplate | null;
  onSave: (template: ReportTemplate) => void;
}

export function ReportEditor({ open, onOpenChange, template, onSave }: ReportEditorProps) {
  const [formData, setFormData] = useState<ReportTemplate>({
    id: '',
    name: '',
    category: 'Geral',
    reportType: 'Personalizado',
    description: '',
    content: '',
    headerContent: '',
    footerContent: '',
    isCustom: true,
    status: 'active'
  });
  
  const [activeTab, setActiveTab] = useState('editor');
  const [editorSection, setEditorSection] = useState<'cabecalho' | 'corpo' | 'rodape'>('corpo');
  const [variables, setVariables] = useState<ReportVariable[]>(DEFAULT_REPORT_VARIABLES);
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [newVar, setNewVar] = useState<Partial<ReportVariable>>({ sourceType: 'system_entity', type: 'texto' });
  
  const editorRefBody = useRef<JoditWrapperRef>(null);
  const editorRefHeader = useRef<JoditWrapperRef>(null);
  const editorRefFooter = useRef<JoditWrapperRef>(null);

  useEffect(() => {
    if (template) {
      setFormData({
        ...template,
        reportType: template.reportType || 'Personalizado',
        headerContent: template.headerContent || '',
        footerContent: template.footerContent || '',
        status: template.status || 'active'
      });
    } else {
      setFormData({
        id: `custom_${Date.now()}`,
        name: 'Novo Modelo',
        category: 'Geral',
        reportType: 'Personalizado',
        description: '',
        content: '',
        headerContent: '',
        footerContent: '',
        isCustom: true,
        status: 'active'
      });
    }
  }, [template, open]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const insertVariable = (key: string) => {
    const variableText = `{{${key}}}`;
    if (editorSection === 'corpo' && editorRefBody.current) editorRefBody.current.insertText(variableText);
    else if (editorSection === 'cabecalho' && editorRefHeader.current) editorRefHeader.current.insertText(variableText);
    else if (editorSection === 'rodape' && editorRefFooter.current) editorRefFooter.current.insertText(variableText);
  };

  const handleCreateVariable = () => {
    if (!newVar.key || !newVar.label || !newVar.sourceType) {
      alert('Preencha os campos obrigatórios (nome, chave e tipo de origem).');
      return;
    }
    
    if (newVar.sourceType === 'system_entity' && (!newVar.entity || !newVar.entityField)) {
       alert('Defina a entidade e o campo de origem do sistema.');
       return;
    }
    
    if (newVar.sourceType === 'manual_field' && !newVar.manualQuestion) {
       alert('Defina a pergunta que será feita na geração do relatório.');
       return;
    }
    
    if (variables.some(v => v.key === newVar.key)) {
      alert('Já existe uma variável com esta chave.');
      return;
    }
    
    const v: ReportVariable = {
      key: newVar.key,
      label: newVar.label,
      sourceType: newVar.sourceType,
      entity: newVar.entity,
      entityField: newVar.entityField,
      manualQuestion: newVar.manualQuestion,
      manualType: newVar.manualType,
      fixedValue: newVar.fixedValue,
      description: newVar.description || '',
      example: newVar.example || `[Exemplo de ${newVar.label}]`,
      type: newVar.type || 'texto',
      isRequired: newVar.isRequired || false
    };
    
    setVariables([...variables, v]);
    setShowVariableModal(false);
    setNewVar({ sourceType: 'system_entity', type: 'texto' });
  };

  const handleTabChange = (val: string) => {
    // Force sync before switching from editor to preview
    if (activeTab === 'editor' && val !== 'editor') {
      if (editorSection === 'corpo' && editorRefBody.current) {
        setFormData(prev => ({...prev, content: editorRefBody.current?.getContent() || prev.content}));
      } else if (editorSection === 'cabecalho' && editorRefHeader.current) {
        setFormData(prev => ({...prev, headerContent: editorRefHeader.current?.getContent() || prev.headerContent}));
      } else if (editorSection === 'rodape' && editorRefFooter.current) {
        setFormData(prev => ({...prev, footerContent: editorRefFooter.current?.getContent() || prev.footerContent}));
      }
    }
    setActiveTab(val);
  };

  const fullContent = `${formData.headerContent || ''}<br/><br/>${formData.content || ''}<br/><br/>${formData.footerContent || ''}`;
  const invalidVars = getInvalidVariables(fullContent, variables);
  const requiredEntities = getRequiredEntities(fullContent, variables);
  
  const mockSelectedEntities = requiredEntities.reduce((acc, entity) => ({ ...acc, [entity]: true }), {});
  
  const previewBody = resolveVariables(formData.content, mockSelectedEntities, variables);
  const previewHeader = resolveVariables(formData.headerContent, mockSelectedEntities, variables);
  const previewFooter = resolveVariables(formData.footerContent, mockSelectedEntities, variables);

  const groupedVariables = variables.reduce((acc, v) => {
    const groupKey = v.sourceType === 'system_entity' && v.entity ? v.entity : 
                     v.sourceType === 'manual_field' ? 'manual' :
                     v.sourceType === 'fixed_value' ? 'fixo' : 'outros';
                     
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(v);
    return acc;
  }, {} as Record<string, ReportVariable[]>);

  const VariablesPanel = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {showVariableModal ? (
         <div className="flex flex-col h-full overflow-y-auto pr-1 pb-4">
            <div className="flex justify-between items-center mb-4 shrink-0 border-b pb-2">
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                 <PlusCircle className="h-4 w-4 text-emerald-600"/>
                 Nova Variável
              </h3>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowVariableModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4 text-sm mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome Amigável</Label>
                <Input 
                  className="h-8 text-xs"
                  placeholder="Ex: Assinatura do Cliente" 
                  value={newVar.label || ''} 
                  onChange={e => {
                    setNewVar({...newVar, label: e.target.value});
                  }} 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Origem *</Label>
                <Select value={newVar.sourceType} onValueChange={(v: VariableSourceType) => setNewVar({...newVar, sourceType: v, key: ''})}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system_entity">Campo de Entidade do Sistema</SelectItem>
                    <SelectItem value="manual_field">Campo Manual (Preenchido na Geração)</SelectItem>
                    <SelectItem value="fixed_value">Valor Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newVar.sourceType === 'system_entity' && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Entidade *</Label>
                    <Select value={newVar.entity} onValueChange={v => {
                        setNewVar({...newVar, entity: v, key: `${v}.${newVar.entityField || ''}`});
                    }}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="os">Ordem de Serviço</SelectItem>
                        <SelectItem value="empresa">Empresa / Filial</SelectItem>
                        <SelectItem value="equipamento_principal">Equipamento Principal</SelectItem>
                        <SelectItem value="tecnico_responsavel">Técnico Responsável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Campo da Entidade *</Label>
                    <Input 
                      className="h-8 text-xs font-mono"
                      placeholder="Ex: telefone" 
                      value={newVar.entityField || ''} 
                      onChange={e => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                        setNewVar({...newVar, entityField: val, key: `${newVar.entity || '?'}.${val}`});
                      }} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Chave Final</Label>
                    <p className="text-[12px] text-zinc-700 bg-zinc-100 p-1.5 rounded font-mono border">{"{{"}{newVar.key || '... . ...'}{"}}"}</p>
                  </div>
                </>
              )}

              {newVar.sourceType === 'manual_field' && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Chave *</Label>
                    <div className="flex items-center">
                      <span className="text-xs text-zinc-500 bg-zinc-100 border border-r-0 rounded-l h-8 px-2 flex items-center">manual.</span>
                      <Input 
                        className="h-8 text-xs font-mono rounded-l-none"
                        placeholder="lanchonete" 
                        value={newVar.key ? newVar.key.replace('manual.', '') : ''} 
                        onChange={e => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                          setNewVar({...newVar, key: val ? `manual.${val}` : ''});
                        }} 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pergunta na Geração *</Label>
                    <Input 
                      className="h-8 text-xs"
                      placeholder="Ex: Informe o nome da lanchonete" 
                      value={newVar.manualQuestion || ''} 
                      onChange={e => setNewVar({...newVar, manualQuestion: e.target.value})} 
                    />
                  </div>
                </>
              )}

              {newVar.sourceType === 'fixed_value' && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Chave *</Label>
                    <div className="flex items-center">
                      <span className="text-xs text-zinc-500 bg-zinc-100 border border-r-0 rounded-l h-8 px-2 flex items-center">fixo.</span>
                      <Input 
                        className="h-8 text-xs font-mono rounded-l-none"
                        placeholder="slogan_empresa" 
                        value={newVar.key ? newVar.key.replace('fixo.', '') : ''} 
                        onChange={e => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                          setNewVar({...newVar, key: val ? `fixo.${val}` : ''});
                        }} 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Valor Fixo</Label>
                    <Input 
                      className="h-8 text-xs"
                      placeholder="Ex: Qualidade e confiança" 
                      value={newVar.fixedValue || ''} 
                      onChange={e => setNewVar({...newVar, fixedValue: e.target.value})} 
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Valor de Ex. (Preview)</Label>
                <Input 
                  className="h-8 text-xs"
                  placeholder="Ex: João da Silva" 
                  value={newVar.example || ''} 
                  onChange={e => setNewVar({...newVar, example: e.target.value})} 
                />
              </div>

              <div className="p-2 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-800 space-y-1">
                 <p className="font-semibold">Resumo:</p>
                 <p>Ao gerar o relatório, esta variável {
                   newVar.sourceType === 'system_entity' ? `puxará a informação automaticamente de ${newVar.entity} > ${newVar.entityField || '?'}` :
                   newVar.sourceType === 'manual_field' ? `perguntará ao usuário: "${newVar.manualQuestion || '...'}"` :
                   `será sempre substituída por "${newVar.fixedValue || '...'}"`
                 }.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2 shrink-0">
               <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateVariable}>Salvar Variável</Button>
               <Button size="sm" variant="outline" className="w-full" onClick={() => setShowVariableModal(false)}>Cancelar</Button>
            </div>
         </div>
      ) : (
         <>
          <div className="flex justify-between items-center mb-4 shrink-0">
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-500">Variáveis</h3>
              <p className="text-[10px] text-zinc-500">Clique para inserir.</p>
            </div>
            <Button size="sm" variant="outline" className="h-7 px-2 gap-1" onClick={() => setShowVariableModal(true)}>
              <PlusCircle className="h-3.5 w-3.5" /> <span className="hidden xl:inline text-xs">Nova</span>
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {Object.entries(groupedVariables).map(([entity, vars]) => (
              <div key={entity} className="space-y-2">
                <Badge variant="secondary" className="uppercase text-[10px] w-full justify-start rounded-sm py-1 bg-zinc-100 dark:bg-zinc-800 border-0">
                  {entity === 'manual' ? 'Preenchimento Manual' : entity === 'fixo' ? 'Valores Fixos' : `Entidade: ${entity}`}
                </Badge>
                <div className="space-y-1">
                  {Array.isArray(vars) && (vars as any[]).map(v => (
                     <div key={v.key} className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded hover:border-emerald-500 hover:shadow-sm transition-all bg-white dark:bg-zinc-900 overflow-hidden group">
                       <button
                         title={v.description}
                         onClick={() => insertVariable(v.key)}
                         className="w-full text-left px-2 py-1 flex items-center justify-between cursor-pointer"
                       >
                         <span className="text-xs font-mono font-medium truncate max-w-[90%] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1 rounded">{`{{${v.key}}}`}</span>
                         <PlusCircle className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-emerald-600" />
                       </button>
                       <div className="px-2 pb-1.5 pt-0.5 pointer-events-none">
                          <span className="text-[11px] font-semibold block text-zinc-800">{v.label}</span>
                          <span className="text-[10px] text-zinc-500 block truncate leading-tight mt-0.5">
                            {v.sourceType === 'system_entity' ? `📍 ${v.entity} > ${v.entityField}` : 
                             v.sourceType === 'manual_field' ? `✍️ ${v.manualQuestion}` : 
                             `🔒 ${v.fixedValue}`}
                          </span>
                       </div>
                     </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
         </>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-0 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 p-0 overflow-hidden rounded-none sm:rounded-lg h-[100dvh] sm:h-[95vh] sm:max-w-[95vw] lg:max-w-[1400px]">
        {/* Header (Top) */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b bg-white dark:bg-zinc-900 shrink-0">
          <DialogTitle className="text-lg flex items-center gap-2 m-0">
            <LayoutTemplate className="h-5 w-5 text-emerald-600" />
            <span>{template ? 'Editar Modelo' : 'Novo Modelo de Relatório'}</span>
          </DialogTitle>
          <div className="flex items-center gap-2">
             <div className="text-xs text-zinc-500 hidden sm:block mr-2">
               {formData.reportType} &bull; {formData.status === 'active' ? 'Ativo' : 'Inativo'}
             </div>
             <DialogClose asChild>
                <Button variant="ghost" size="icon"><X className="h-4 w-4"/></Button>
             </DialogClose>
          </div>
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950">
          
          {/* Left Column (Config) - Desktop Only, converted to Tab in mobile */}
          <div className="hidden md:block w-64 border-r bg-white dark:bg-zinc-900 p-4 overflow-y-auto shrink-0 relative z-10 space-y-4">
             <div className="space-y-2">
               <Label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2 block">Configurações</Label>
               
               <div className="space-y-1.5">
                 <Label>Nome do Modelo *</Label>
                 <Input className="h-8 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Laudo Técnico" />
               </div>
               <div className="space-y-1.5 mt-3">
                 <Label>Categoria</Label>
                 <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                   <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Geral">Geral</SelectItem>
                     <SelectItem value="Vendas">Vendas</SelectItem>
                     <SelectItem value="Técnico">Técnico</SelectItem>
                     <SelectItem value="Financeiro">Financeiro</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-1.5 mt-3">
                 <Label>Tipo de Relatório</Label>
                 <Select value={formData.reportType} onValueChange={v => setFormData({...formData, reportType: v})}>
                   <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Personalizado">Personalizado</SelectItem>
                     <SelectItem value="Laudo">Laudo Técnico</SelectItem>
                     <SelectItem value="Servico">Relatório de Serviço</SelectItem>
                     <SelectItem value="Comercial">Comercial / Vendas</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-1.5 mt-3">
                 <Label>Descrição</Label>
                 <Input className="h-8 text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Finalidade..." />
               </div>
               
               <div className="pt-4 flex items-center space-x-2">
                 <Switch checked={formData.status === 'active'} onCheckedChange={(c) => setFormData({...formData, status: c ? 'active' : 'inactive'})} />
                 <Label>{formData.status === 'active' ? 'Modelo Ativo' : 'Inativo'}</Label>
               </div>
             </div>
          </div>

          {/* Center Column (Editor/Tabs) */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 px-2 sm:px-4 pb-2 relative min-w-0">
             <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0 w-full h-full">
               <div className="shrink-0 overflow-x-auto hide-scrollbar pt-2 sm:pt-4 mb-2 flex justify-between items-center">
                 <TabsList className="bg-zinc-200/50 dark:bg-zinc-800">
                   {/* Mobile Config Tab */}
                   <TabsTrigger value="config" className="gap-2 md:hidden"><Settings className="h-4 w-4"/> Configs</TabsTrigger>
                   <TabsTrigger value="editor" className="gap-2"><FileText className="h-4 w-4"/> Editor Central</TabsTrigger>
                   <TabsTrigger value="preview" className="gap-2"><Eye className="h-4 w-4"/> Preview PDF</TabsTrigger>
                   {/* Mobile Variables Tab */}
                   <TabsTrigger value="variaveis" className="gap-2 md:hidden"><PlusCircle className="h-4 w-4"/> Variáveis</TabsTrigger>
                 </TabsList>
               </div>

               {/* Mobile Config Content */}
               <TabsContent value="config" className="flex-1 overflow-y-auto mt-0 data-[state=inactive]:hidden bg-white dark:bg-zinc-900 border rounded-md p-4">
                 <div className="space-y-4 max-w-lg">
                   <div className="space-y-1.5">
                     <Label>Nome do Modelo *</Label>
                     <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Laudo Técnico" />
                   </div>
                   <div className="space-y-1.5">
                     <Label>Categoria</Label>
                     <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="Geral">Geral</SelectItem>
                         <SelectItem value="Vendas">Vendas</SelectItem>
                         <SelectItem value="Técnico">Técnico</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-1.5">
                     <Label>Tipo de Relatório</Label>
                     <Select value={formData.reportType} onValueChange={v => setFormData({...formData, reportType: v})}>
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="Personalizado">Personalizado</SelectItem>
                         <SelectItem value="Laudo">Laudo Técnico</SelectItem>
                         <SelectItem value="Servico">Relatório de Serviço</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-1.5">
                     <Label>Descrição</Label>
                     <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                   </div>
                   <div className="flex items-center space-x-2 pt-2">
                     <Switch checked={formData.status === 'active'} onCheckedChange={(c) => setFormData({...formData, status: c ? 'active' : 'inactive'})} />
                     <Label>{formData.status === 'active' ? 'Modelo Ativo' : 'Inativo'}</Label>
                   </div>
                 </div>
               </TabsContent>

               {/* Editor Content */}
               <TabsContent value="editor" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden border rounded-md shadow-sm relative z-0 flex flex-col bg-zinc-50 dark:bg-zinc-950">
                 <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs text-center border-b shrink-0 flex items-center justify-center gap-2">
                    <div className="hidden sm:flex items-center gap-1 font-semibold mr-2">
                       <FileText className="h-4 w-4" /> Editando:
                    </div>
                    <div className="flex bg-white dark:bg-zinc-900 rounded shadow-sm overflow-hidden border border-emerald-200 dark:border-zinc-700">
                       <button onClick={() => setEditorSection('cabecalho')} className={`px-4 py-1.5 font-medium transition-colors ${editorSection === 'cabecalho' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 dark:hover:bg-zinc-800 cursor-pointer'}`}>Cabeçalho</button>
                       <button onClick={() => setEditorSection('corpo')} className={`px-4 py-1.5 font-medium border-l border-r border-emerald-200 dark:border-zinc-700 transition-colors ${editorSection === 'corpo' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 dark:hover:bg-zinc-800 cursor-pointer'}`}>Corpo</button>
                       <button onClick={() => setEditorSection('rodape')} className={`px-4 py-1.5 font-medium transition-colors ${editorSection === 'rodape' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 dark:hover:bg-zinc-800 cursor-pointer'}`}>Rodapé</button>
                    </div>
                 </div>
                 <div className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar relative flex flex-col">
                    <div className="mx-auto w-full max-w-4xl bg-white dark:bg-zinc-900 rounded shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col flex-1 relative">
                       {editorSection === 'cabecalho' && (
                          <div className="p-4 flex-1 flex flex-col">
                            <div className="mb-2 text-xs font-bold uppercase text-emerald-600">Cabeçalho do Relatório</div>
                            <div className="flex-1 min-h-[250px]"><JoditWrapper ref={editorRefHeader} content={formData.headerContent} onChange={(c) => setFormData({...formData, headerContent: c})} /></div>
                          </div>
                       )}
                       {editorSection === 'corpo' && (
                          <div className="p-4 flex-1 flex flex-col">
                            <div className="mb-2 text-xs font-bold uppercase text-emerald-600">Corpo Principal do Relatório</div>
                            <div className="flex-1 min-h-[250px]"><JoditWrapper ref={editorRefBody} content={formData.content} onChange={(c) => setFormData({...formData, content: c})} /></div>
                          </div>
                       )}
                       {editorSection === 'rodape' && (
                          <div className="p-4 flex-1 flex flex-col">
                            <div className="mb-2 text-xs font-bold uppercase text-emerald-600">Rodapé do Relatório</div>
                            <div className="flex-1 min-h-[250px]"><JoditWrapper ref={editorRefFooter} content={formData.footerContent} onChange={(c) => setFormData({...formData, footerContent: c})} /></div>
                          </div>
                       )}
                    </div>
                 </div>
               </TabsContent>

               {/* Preview Content */}
               <TabsContent value="preview" className="flex-1 overflow-y-auto mt-0 data-[state=inactive]:hidden border rounded-md relative bg-zinc-200 dark:bg-zinc-800">
                  <ReportDocumentCanvas 
                     headerHtml={formData.headerContent}
                     bodyHtml={formData.content}
                     footerHtml={formData.footerContent}
                     variables={variables}
                  />
               </TabsContent>

               {/* Mobile Variables Content */}
               <TabsContent value="variaveis" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden bg-white dark:bg-zinc-900 border rounded-md p-4">
                 <VariablesPanel />
               </TabsContent>

             </Tabs>
          </div>

          {/* Right Column (Variables) - Desktop Only */}
          <div className="hidden md:block w-72 border-l bg-white dark:bg-zinc-900 p-4 overflow-hidden shrink-0 relative z-10">
             <VariablesPanel />
          </div>

        </div>

        {/* Footer (Bottom) */}
        <div className="p-4 border-t bg-white dark:bg-zinc-900 shrink-0 flex justify-between items-center z-20">
          <div className="text-sm text-zinc-500 hidden sm:block">
            {formData.name || 'Novo Modelo'} &bull; Variáveis disponíveis {variables.length}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700">Salvar Modelo</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
