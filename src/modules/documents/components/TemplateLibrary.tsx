import { useState, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Maximize2,
  Minimize2,
  X,
  FileText
} from 'lucide-react';
import { DocumentTemplate, AVAILABLE_PLACEHOLDERS, Placeholder } from '../types';
import { toast } from 'sonner';
import { JoditWrapper, JoditWrapperRef } from './JoditWrapper';
import { Rnd } from 'react-rnd';

export function TemplateLibrary() {
  const editorRef = useRef<JoditWrapperRef>(null);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([
    {
      id: '1',
      name: 'Laudo Técnico Padrão',
      type: 'Laudo Técnico',
      category: 'Técnica',
      content: '<h1>LAUDO TÉCNICO</h1><p>Insira o conteúdo do laudo aqui.</p>',
      version: 3,
      createdAt: '2024-03-01',
      updatedAt: '2024-03-01',
      createdBy: 'Admin',
      isSystem: true
    },
    {
      id: '2',
      name: 'POP - Limpeza de Equipamento',
      type: 'POP',
      category: 'Qualidade',
      content: '<h1>PROCEDIMENTO OPERACIONAL PADRÃO</h1><p>Descreva o procedimento.</p>',
      version: 1,
      createdAt: '2024-03-05',
      updatedAt: '2024-03-05',
      createdBy: 'Admin'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [generatingTemplate, setGeneratingTemplate] = useState<DocumentTemplate | null>(null);
  const [templateContent, setTemplateContent] = useState('');
  const [templateHeader, setTemplateHeader] = useState('');
  const [templateFooter, setTemplateFooter] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [activeEditor, setActiveEditor] = useState<'body' | 'header' | 'footer'>('body');
  const [customVariables, setCustomVariables] = useState<Placeholder[]>([]);
  const [isVariableDialogOpen, setIsVariableDialogOpen] = useState(false);
  const [variableForm, setVariableForm] = useState({ key: '', label: '', category: 'Personalizado' });

  const allVariables = [...AVAILABLE_PLACEHOLDERS, ...customVariables];

  const handleDelete = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Modelo excluído com sucesso');
  };

  const handleEdit = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    
    // Convert old JSON AST to simple HTML if needed (fallback)
    let content = template.content;
    if (content.trim().startsWith('{')) {
      try {
        const ast = JSON.parse(content);
        if (ast.blocks) {
          content = ast.blocks.map((b: any) => {
            if (b.type === 'heading') return `<h${b.level || 1}>${b.content}</h${b.level || 1}>`;
            if (b.type === 'paragraph') return `<p>${b.content}</p>`;
            return `<p>${JSON.stringify(b)}</p>`;
          }).join('');
        }
      } catch (e) {
        // ignore
      }
    }
    
    setTemplateContent(content);
    setTemplateHeader(template.headerContent || '');
    setTemplateFooter(template.footerContent || '');
    setActiveEditor('body');
    setIsDialogOpen(true);
  };

  const handleGenerate = (template: DocumentTemplate) => {
    setGeneratingTemplate(template);
    
    // Convert old JSON AST to simple HTML if needed (fallback)
    let content = template.content;
    if (content.trim().startsWith('{')) {
      try {
        const ast = JSON.parse(content);
        if (ast.blocks) {
          content = ast.blocks.map((b: any) => {
            if (b.type === 'heading') return `<h${b.level || 1}>${b.content}</h${b.level || 1}>`;
            if (b.type === 'paragraph') return `<p>${b.content}</p>`;
            return `<p>${JSON.stringify(b)}</p>`;
          }).join('');
        }
      } catch (e) {
        // ignore
      }
    }
    
    setGeneratedContent(content);
    setTemplateHeader(template.headerContent || '');
    setTemplateFooter(template.footerContent || '');
    setActiveEditor('body');
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setTemplateContent('<h1>Novo Documento</h1><p>Comece a digitar aqui...</p>');
    setTemplateHeader('');
    setTemplateFooter('');
    setActiveEditor('body');
    setIsDialogOpen(true);
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Controle de documentos</h3>
          <p className="text-sm text-zinc-500">Crie modelos e gere novos documentos a partir deles.</p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Novo Modelo
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input 
            placeholder="Buscar modelos..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-2">
                <Badge variant={template.isSystem ? "default" : "secondary"}>
                  {template.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  v{template.version}.0
                </Badge>
              </div>
              <CardTitle className="text-lg line-clamp-1" title={template.name}>
                {template.name}
              </CardTitle>
              <CardDescription>
                {template.type}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-xs text-zinc-500 mb-6 space-y-1">
                <p>Atualizado em: {new Date(template.updatedAt).toLocaleDateString()}</p>
                <p>Por: {template.createdBy}</p>
              </div>
              <div className="flex justify-end gap-2 mt-auto">
                <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleGenerate(template)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                {!template.isSystem && (
                  <Button variant="outline" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDelete(template.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Rnd
            default={{
              x: (window.innerWidth - Math.min(1200, window.innerWidth * 0.95)) / 2,
              y: (window.innerHeight - Math.min(800, window.innerHeight * 0.95)) / 2,
              width: Math.min(1200, window.innerWidth * 0.95),
              height: Math.min(800, window.innerHeight * 0.95),
            }}
            minWidth={600}
            minHeight={400}
            bounds="window"
            disableDragging={isFullscreen}
            enableResizing={!isFullscreen}
            className={`bg-white dark:bg-zinc-950 flex flex-col overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 ${isFullscreen ? 'w-screen h-screen rounded-none' : 'rounded-lg'}`}
            style={isFullscreen ? { width: '100vw', height: '100vh', transform: 'none' } : {}}
            position={isFullscreen ? { x: 0, y: 0 } : undefined}
            size={isFullscreen ? { width: '100vw', height: '100vh' } : undefined}
            dragHandleClassName="dialog-header-drag"
          >
            <div className="dialog-header-drag p-4 border-b shrink-0 flex flex-row items-center justify-between cursor-move bg-white dark:bg-zinc-950">
              <div>
                <h2 className="text-lg font-semibold leading-none tracking-tight">{editingTemplate ? 'Editar Modelo' : 'Novo Modelo'}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Use o editor visual para criar o conteúdo do seu documento.
                </p>
              </div>
              <div className="flex items-center gap-2 cursor-default" onMouseDown={e => e.stopPropagation()}>
                <Button variant="outline" size="sm" onClick={() => setShowVariables(!showVariables)}>
                  {showVariables ? 'Ocultar Variáveis' : 'Ver Variáveis'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowVisualizer(!showVisualizer)}>
                  {showVisualizer ? 'Ocultar Visualizador' : 'Ver Visualizador'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 min-h-0 overflow-hidden flex bg-zinc-100 dark:bg-zinc-900">
              {/* Left Pane: Variables */}
              {showVariables && (
                <div className="w-64 flex flex-col bg-white dark:bg-zinc-950 border-r overflow-hidden">
                  <div className="p-3 border-b bg-zinc-50 dark:bg-zinc-900 shrink-0 flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-semibold">Variáveis Disponíveis</h4>
                      <p className="text-xs text-zinc-500 mt-1">Clique para inserir no editor</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsVariableDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-4 custom-scrollbar">
                    {Array.from(new Set(allVariables.map(p => p.category))).map(category => (
                      <div key={category}>
                        <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-2">{category}</h5>
                        <div className="space-y-1">
                          {allVariables.filter(p => p.category === category).map(p => (
                            <div 
                              key={p.key} 
                              className="px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-xs cursor-pointer group flex flex-col"
                              onClick={() => {
                                if (editorRef.current) {
                                  editorRef.current.insertText(`#${p.key}#`);
                                  toast.success(`Variável #${p.key}# inserida!`);
                                } else {
                                  navigator.clipboard.writeText(`#${p.key}#`);
                                  toast.success(`Variável #${p.key}# copiada!`);
                                }
                              }}
                            >
                              <span className="font-mono text-blue-600 dark:text-blue-400 group-hover:underline">#{p.key}#</span>
                              <span className="text-zinc-500 truncate" title={p.label}>{p.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Center Pane: Editor */}
              <div className={`flex flex-col border-r transition-all duration-300 min-h-0 ${showVisualizer ? 'flex-1' : 'flex-1'}`}>
                <div className="flex border-b bg-zinc-50 dark:bg-zinc-900 shrink-0">
                  <button 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeEditor === 'header' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                    onClick={() => setActiveEditor('header')}
                  >
                    Cabeçalho
                  </button>
                  <button 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeEditor === 'body' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                    onClick={() => setActiveEditor('body')}
                  >
                    Corpo do Documento
                  </button>
                  <button 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeEditor === 'footer' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                    onClick={() => setActiveEditor('footer')}
                  >
                    Rodapé
                  </button>
                </div>
                
                {activeEditor === 'header' && (
                  <JoditWrapper 
                    ref={editorRef}
                    content={templateHeader} 
                    onChange={setTemplateHeader} 
                  />
                )}
                {activeEditor === 'body' && (
                  <JoditWrapper 
                    ref={editorRef}
                    content={templateContent} 
                    onChange={setTemplateContent} 
                  />
                )}
                {activeEditor === 'footer' && (
                  <JoditWrapper 
                    ref={editorRef}
                    content={templateFooter} 
                    onChange={setTemplateFooter} 
                  />
                )}
              </div>

              {/* Right Pane: Visualizer */}
              {showVisualizer && (
                <div className="w-1/2 flex flex-col bg-zinc-200 dark:bg-zinc-900 overflow-auto">
                  <div className="p-8 min-h-full flex items-center justify-center">
                    {/* A4 Page Representation */}
                    <div className="bg-white w-[210mm] min-w-[210mm] min-h-[297mm] shadow-xl ring-1 ring-zinc-900/5 p-[20mm] transition-all prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl break-words flex flex-col">
                      <style>{`
                        .prose table {
                          border-collapse: collapse;
                          table-layout: fixed;
                          width: 100%;
                          margin: 0;
                          overflow: hidden;
                        }
                        .prose td, .prose th {
                          min-width: 1em;
                          border: 2px solid #ced4da;
                          padding: 3px 5px;
                          vertical-align: top;
                          box-sizing: border-box;
                          position: relative;
                        }
                        .prose th {
                          font-weight: bold;
                          text-align: left;
                          background-color: #f1f3f5;
                        }
                        .prose span[data-type="variable"] {
                          display: inline-flex;
                          align-items: center;
                          padding: 0.125rem 0.5rem;
                          border-radius: 0.25rem;
                          font-size: 0.75rem;
                          font-weight: 500;
                          background-color: #fef3c7;
                          color: #92400e;
                          border: 1px solid #fde68a;
                          margin: 0 0.25rem;
                        }
                        .prose img {
                          max-width: 100%;
                          height: auto;
                          border-radius: 4px;
                          display: inline-block;
                        }
                        .page-break-visualizer {
                          width: 100%;
                          height: 20px;
                          background-color: #f4f4f5;
                          border-top: 1px dashed #a1a1aa;
                          border-bottom: 1px dashed #a1a1aa;
                          margin: 20mm -20mm;
                          position: relative;
                        }
                        .page-break-visualizer::after {
                          content: 'Quebra de Página';
                          position: absolute;
                          top: 50%;
                          left: 50%;
                          transform: translate(-50%, -50%);
                          font-size: 10px;
                          color: #a1a1aa;
                          text-transform: uppercase;
                          letter-spacing: 1px;
                        }
                      `}</style>
                      
                      {templateHeader && (
                        <div 
                          className="mb-8 border-b pb-4 opacity-70"
                          dangerouslySetInnerHTML={{ __html: templateHeader }} 
                        />
                      )}
                      
                      <div 
                        className="flex-1"
                        dangerouslySetInnerHTML={{ __html: templateContent.replace(/<div class="page-break".*?<\/div>/g, '<div class="page-break-visualizer"></div>') }} 
                      />
                      
                      {templateFooter && (
                        <div 
                          className="mt-8 border-t pt-4 opacity-70"
                          dangerouslySetInnerHTML={{ __html: templateFooter }} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-white dark:bg-zinc-950 shrink-0 flex justify-end gap-2 cursor-default" onMouseDown={e => e.stopPropagation()}>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => {
                toast.success('Modelo salvo com sucesso!');
                setIsDialogOpen(false);
              }}>Salvar Modelo</Button>
            </div>
          </Rnd>
        </div>
      )}

      {generatingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Rnd
            default={{
              x: (window.innerWidth - Math.min(1200, window.innerWidth * 0.95)) / 2,
              y: (window.innerHeight - Math.min(800, window.innerHeight * 0.95)) / 2,
              width: Math.min(1200, window.innerWidth * 0.95),
              height: Math.min(800, window.innerHeight * 0.95),
            }}
            minWidth={600}
            minHeight={400}
            bounds="window"
            disableDragging={isFullscreen}
            enableResizing={!isFullscreen}
            className={`bg-white dark:bg-zinc-950 flex flex-col overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 ${isFullscreen ? 'w-screen h-screen rounded-none' : 'rounded-lg'}`}
            style={isFullscreen ? { width: '100vw', height: '100vh', transform: 'none' } : {}}
            position={isFullscreen ? { x: 0, y: 0 } : undefined}
            size={isFullscreen ? { width: '100vw', height: '100vh' } : undefined}
            dragHandleClassName="dialog-header-drag-gen"
          >
            <div className="dialog-header-drag-gen p-4 border-b shrink-0 flex flex-row items-center justify-between cursor-move bg-white dark:bg-zinc-950">
              <div>
                <h2 className="text-lg font-semibold leading-none tracking-tight">Gerar Documento: {generatingTemplate.name}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Preencha os dados e edite o documento gerado.
                </p>
              </div>
              <div className="flex items-center gap-2 cursor-default" onMouseDown={e => e.stopPropagation()}>
                <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setGeneratingTemplate(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 min-h-0 overflow-hidden flex bg-zinc-100 dark:bg-zinc-900">
              <div className="flex-1 flex flex-col w-full min-h-0">
                <div className="flex border-b bg-zinc-50 dark:bg-zinc-900 shrink-0">
                  <button 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeEditor === 'header' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                    onClick={() => setActiveEditor('header')}
                  >
                    Cabeçalho
                  </button>
                  <button 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeEditor === 'body' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                    onClick={() => setActiveEditor('body')}
                  >
                    Corpo do Documento
                  </button>
                  <button 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeEditor === 'footer' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                    onClick={() => setActiveEditor('footer')}
                  >
                    Rodapé
                  </button>
                </div>
                
                {activeEditor === 'header' && (
                  <JoditWrapper 
                    ref={editorRef}
                    content={templateHeader} 
                    onChange={setTemplateHeader} 
                  />
                )}
                {activeEditor === 'body' && (
                  <JoditWrapper 
                    ref={editorRef}
                    content={generatedContent} 
                    onChange={setGeneratedContent} 
                  />
                )}
                {activeEditor === 'footer' && (
                  <JoditWrapper 
                    ref={editorRef}
                    content={templateFooter} 
                    onChange={setTemplateFooter} 
                  />
                )}
              </div>
            </div>

            <div className="p-4 border-t bg-white dark:bg-zinc-950 shrink-0 flex justify-between items-center cursor-default" onMouseDown={e => e.stopPropagation()}>
              <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => {
                let newContent = generatedContent;
                let newHeader = templateHeader;
                let newFooter = templateFooter;
                
                allVariables.forEach(p => {
                  const regex = new RegExp(`#${p.key}#`, 'g');
                  let mockValue = `[${p.label}]`;
                  if (p.key === 'Cliente.Nome' || p.key === 'VW_CONTRATO.Nome_Aluno') mockValue = 'João da Silva';
                  if (p.key === 'Cliente.Documento' || p.key === 'VW_CONTRATO.CPF_Aluno') mockValue = '123.456.789-00';
                  if (p.key === 'VW_CONTRATO.ValorGlobal') mockValue = 'R$ 15.000,00';
                  if (p.key === 'VW_CONTRATO.QuantidadeParcelas') mockValue = '12x';
                  if (p.key === 'VW_CONTRATO.ValorParcela') mockValue = 'R$ 1.250,00';
                  if (p.key === 'DataAtual') mockValue = new Date().toLocaleDateString();
                  newContent = newContent.replace(regex, mockValue);
                  if (newHeader) newHeader = newHeader.replace(regex, mockValue);
                  if (newFooter) newFooter = newFooter.replace(regex, mockValue);
                });
                setGeneratedContent(newContent);
                setTemplateHeader(newHeader);
                setTemplateFooter(newFooter);
                toast.success('Variáveis preenchidas com dados de exemplo!');
              }}>
                Simular Preenchimento Automático
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setGeneratingTemplate(null)}>Cancelar</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                  toast.success('Documento gerado e salvo com sucesso!');
                  setGeneratingTemplate(null);
                }}>
                  <FileText className="h-4 w-4 mr-2" />
                  Salvar Documento Final
                </Button>
              </div>
            </div>
          </Rnd>
        </div>
      )}
      {isVariableDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-lg w-full max-w-md shadow-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold mb-4">Adicionar Variável Personalizada</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Chave (sem os #)</label>
                <Input 
                  placeholder="Ex: MinhaVariavel" 
                  value={variableForm.key}
                  onChange={e => setVariableForm({...variableForm, key: e.target.value.replace(/[^a-zA-Z0-9_.]/g, '')})}
                />
                <p className="text-xs text-zinc-500 mt-1">Apenas letras, números, pontos e underlines.</p>
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Input 
                  placeholder="Ex: Nome do responsável" 
                  value={variableForm.label}
                  onChange={e => setVariableForm({...variableForm, label: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Categoria</label>
                <Input 
                  placeholder="Ex: Personalizado" 
                  value={variableForm.category}
                  onChange={e => setVariableForm({...variableForm, category: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsVariableDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => {
                if (!variableForm.key || !variableForm.label) {
                  toast.error('Preencha a chave e a descrição.');
                  return;
                }
                setCustomVariables([...customVariables, variableForm]);
                setVariableForm({ key: '', label: '', category: 'Personalizado' });
                setIsVariableDialogOpen(false);
                toast.success('Variável adicionada com sucesso!');
              }}>Adicionar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
