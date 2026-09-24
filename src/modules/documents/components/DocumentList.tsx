
import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  MoreHorizontal, 
  Eye, 
  Download, 
  Printer,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Document, DocumentStatus } from '../types';

export function DocumentList() {
  const [documents] = useState<Document[]>([
    {
      id: 'DOC-2024-001',
      templateId: '1',
      title: 'Laudo Técnico - Hospital Santa Maria',
      type: 'Laudo Técnico',
      category: 'Técnica',
      status: 'Vigente',
      content: '...',
      fieldValues: {},
      createdBy: 'Carlos Silva',
      createdAt: '2024-03-05',
      updatedAt: '2024-03-05',
      issuedAt: '2024-03-05',
      hash: '8a7b...9c2d',
      version: '1.0'
    },
    {
      id: 'DOC-2024-002',
      templateId: '2',
      title: 'Contrato de Prestação de Serviços - Clínica Sorriso',
      type: 'Contrato',
      category: 'Comercial',
      status: 'Em Revisão',
      content: '...',
      fieldValues: {},
      createdBy: 'Ana Paula',
      createdAt: '2024-03-04',
      updatedAt: '2024-03-04',
      version: '1.1'
    },
    {
      id: 'DOC-2024-003',
      templateId: '3',
      title: 'Alvará de Funcionamento 2023',
      type: 'Alvará',
      category: 'Regulatório',
      status: 'Vencido',
      content: '...',
      fieldValues: {},
      createdBy: 'Sistema',
      createdAt: '2023-01-10',
      updatedAt: '2023-01-10',
      validUntil: '2023-12-31',
      version: '1.0'
    }
  ]);

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'Vigente': return 'bg-emerald-500 hover:bg-emerald-600';
      case 'Em Revisão': return 'bg-amber-500 hover:bg-amber-600';
      case 'Vencido': return 'bg-rose-500 hover:bg-rose-600';
      case 'Obsoleto': return 'bg-zinc-500 hover:bg-zinc-600';
      case 'Rascunho': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-zinc-400 hover:bg-zinc-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Buscar documentos..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="emitido">Emitidos</SelectItem>
              <SelectItem value="rascunho">Rascunhos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filtros</Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Documento</TableHead>
              <TableHead>Categoria / Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado por</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-zinc-500" />
                    {doc.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-6">
                    <span className="text-[10px] text-zinc-400 font-mono">{doc.id}</span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1">v{doc.version}</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{doc.category}</span>
                    <span className="text-xs text-zinc-500">{doc.type}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{doc.createdBy}</span>
                    <span className="text-xs text-zinc-500">{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {doc.validUntil ? (
                    <div className="flex flex-col">
                      <span className={`text-sm ${doc.status === 'Vencido' ? 'text-rose-600 font-medium' : ''}`}>
                        {new Date(doc.validUntil).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400">Sem validade</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {doc.status === 'Vigente' && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
