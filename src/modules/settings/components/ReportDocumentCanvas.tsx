// src/modules/settings/components/ReportDocumentCanvas.tsx
import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { ReportVariable, resolveVariables, getInvalidVariables, getRequiredEntities } from './reportVariables';

interface ReportDocumentCanvasProps {
  headerHtml: string;
  bodyHtml: string;
  footerHtml: string;
  variables: ReportVariable[];
}

export function ReportDocumentCanvas({ headerHtml, bodyHtml, footerHtml, variables }: ReportDocumentCanvasProps) {
  const fullContent = `${headerHtml || ''}<br/><br/>${bodyHtml || ''}<br/><br/>${footerHtml || ''}`;
  const invalidVars = getInvalidVariables(fullContent, variables);
  const requiredEntities = getRequiredEntities(fullContent, variables);
  
  const mockSelectedEntities = requiredEntities.reduce((acc, entity) => ({ ...acc, [entity]: true }), {});
  
  const previewBody = resolveVariables(bodyHtml, mockSelectedEntities, variables);
  const previewHeader = resolveVariables(headerHtml, mockSelectedEntities, variables);
  const previewFooter = resolveVariables(footerHtml, mockSelectedEntities, variables);

  return (
    <div className="w-full flex-1 flex flex-col pt-4">
      {invalidVars.length > 0 && (
        <div className="shrink-0 p-3 mb-4 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm flex gap-2 w-full max-w-4xl mx-auto">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <strong>Variáveis Inválidas (Não substituídas):</strong>
            <ul className="list-disc pl-4 mt-1">{invalidVars.map(v => <li key={v}>{v}</li>)}</ul>
          </div>
        </div>
      )}
      
      <div className="mx-auto w-[794px] max-w-full bg-white text-black min-h-[1123px] shadow-md border rounded flex flex-col p-10 print:shadow-none print:border-none print:m-0 mb-8 relative">
        {/* Visual page separator line could be added here if simulating multiple pages later */}
        
        {/* Header content */}
        {previewHeader && (
          <div dangerouslySetInnerHTML={{ __html: previewHeader }} className="border-b mb-6 pb-2 shrink-0" />
        )}
        
        {/* Render empty state clear message if everything is empty */}
        {!previewHeader && !previewBody && !previewFooter ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
               <FileText className="h-16 w-16 mb-4 text-zinc-200" />
               <p>O relatório está vazio.</p>
               <p className="text-sm mt-1">Volte na aba "Editor Central" e digite algo.</p>
            </div>
        ) : (
            <div className="flex-1 prose prose-slate max-w-none break-words" dangerouslySetInnerHTML={{ __html: previewBody }} />
        )}

        {/* Footer content */}
        {previewFooter && (
          <div dangerouslySetInnerHTML={{ __html: previewFooter }} className="mt-auto border-t pt-4 text-sm shrink-0" />
        )}
      </div>
    </div>
  );
}
