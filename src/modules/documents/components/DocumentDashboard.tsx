
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  BookOpen, 
  History, 
  Plus, 
  Settings, 
  LayoutGrid,
  FileSignature,
  ShieldAlert
} from 'lucide-react';
import { TemplateLibrary } from './TemplateLibrary';
import { DocumentList } from './DocumentList';
import { POPManager } from './POPManager';
import { ContractManager } from './ContractManager';
import { ComplianceManager } from './ComplianceManager';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { ModuleStatusBadge } from '@/components/common/ModuleStatusBadge';

export function DocumentDashboard({ defaultTab = 'meus-documentos' }: { defaultTab?: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { can } = usePermissions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Gestão de Documentos</h2>
            <ModuleStatusBadge status="Visual" />
          </div>
          <p className="text-zinc-500">Crie, gerencie e emita documentos oficiais com segurança.</p>
        </div>
        <div className="flex gap-2">
          {can('manage_templates') && (
            <Button variant="outline" onClick={() => setActiveTab('modelos')}>
              <Settings className="h-4 w-4 mr-2" /> Gerenciar Modelos
            </Button>
          )}
          {can('edit_documents') && (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setActiveTab('modelos')}>
              <Plus className="h-4 w-4 mr-2" /> Novo Documento
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border dark:bg-zinc-900 w-full justify-start h-12 p-1 overflow-x-auto custom-scrollbar flex-nowrap">
          <TabsTrigger value="meus-documentos" className="gap-2 h-10 px-4 whitespace-nowrap">
            <FileText className="h-4 w-4" /> Repositório Central
          </TabsTrigger>
          <TabsTrigger value="contratos" className="gap-2 h-10 px-4 whitespace-nowrap">
            <FileSignature className="h-4 w-4" /> Gestão de Contratos
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2 h-10 px-4 whitespace-nowrap">
            <ShieldAlert className="h-4 w-4" /> Compliance e Regras
          </TabsTrigger>
          {can('manage_templates') && (
            <TabsTrigger value="modelos" className="gap-2 h-10 px-4 whitespace-nowrap">
              <LayoutGrid className="h-4 w-4" /> Controle de documentos
            </TabsTrigger>
          )}
          <TabsTrigger value="pop" className="gap-2 h-10 px-4 whitespace-nowrap">
            <BookOpen className="h-4 w-4" /> POP / Procedimentos
          </TabsTrigger>
          {can('view_audit') && (
            <TabsTrigger value="historico" className="gap-2 h-10 px-4 whitespace-nowrap">
              <History className="h-4 w-4" /> Auditoria
            </TabsTrigger>
          )}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="meus-documentos">
            <DocumentList />
          </TabsContent>

          <TabsContent value="contratos">
            <ContractManager />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceManager />
          </TabsContent>

          {can('manage_templates') && (
            <TabsContent value="modelos">
              <TemplateLibrary />
            </TabsContent>
          )}

          <TabsContent value="pop">
            <POPManager />
          </TabsContent>

          {can('view_audit') && (
            <TabsContent value="historico">
              <div className="flex flex-col items-center justify-center h-[400px] text-zinc-400 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border-dashed">
                <History className="h-12 w-12 mb-4 opacity-20" />
                <p>Histórico de auditoria e logs de acesso.</p>
              </div>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
